import prisma from "@/lib/prisma";
import { appendLeadNote, determineProgramTypeFromLead } from "@/lib/leads";
import { hashPin, normalizeMobile } from "@/server/auth/unified-auth";

function randomPin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function usernameFromMobile(prefix: string, mobile: string) {
  return `${prefix}_${mobile}`;
}

async function pickRoundRobinMentor() {
  const mentors = await prisma.user.findMany({
    where: { role: "mentor", isActive: true },
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  if (mentors.length === 0) return null;

  const counts = await prisma.studentAccount.groupBy({
    by: ["mentorId"],
    where: {
      mentorId: { in: mentors.map((mentor) => mentor.id) },
      admissionStatus: "active",
    },
    _count: { _all: true },
  });
  const countByMentor = new Map(
    counts.map((row) => [row.mentorId, row._count._all]),
  );

  return mentors
    .map((mentor) => ({
      ...mentor,
      studentCount: countByMentor.get(mentor.id) ?? 0,
    }))
    .sort((a, b) => {
      if (a.studentCount !== b.studentCount) {
        return a.studentCount - b.studentCount;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    })[0];
}

async function main() {
  const actor = await prisma.user.findFirst({
    where: { role: { in: ["admin", "manager", "administrative_officer"] }, isActive: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  if (!actor) {
    throw new Error("No active admin/manager user found for createdBy.");
  }

  const admissions = await prisma.admission.findMany({
    where: { status: "approved" },
    include: { lead: true },
    orderBy: { createdAt: "asc" },
  });

  let created = 0;
  let skipped = 0;

  for (const admission of admissions) {
    const mobile = normalizeMobile(admission.phone);
    const existingAccount = await prisma.studentAccount.findUnique({
      where: { mobile },
      select: { id: true },
    });

    if (existingAccount) {
      skipped += 1;
      continue;
    }

    const mentor = await pickRoundRobinMentor();
    const studentPin = randomPin();
    let parentPin = randomPin();
    if (parentPin === studentPin) parentPin = randomPin();
    const studentPinHash = await hashPin(studentPin);
    const parentPinHash = await hashPin(parentPin);
    const programType = determineProgramTypeFromLead({
      type: admission.type,
      notes: admission.notes,
    });

    await prisma.$transaction(async (tx) => {
      const studentUser =
        (await tx.user.findFirst({
          where: { mobile, role: "student" },
        })) ??
        (await tx.user.create({
          data: {
            name: admission.studentName.trim(),
            mobile,
            pin: studentPinHash,
            role: "student",
            isActive: true,
            createdBy: actor.id,
          },
        }));

      const parentUser =
        (await tx.user.findFirst({
          where: { mobile, role: "parent" },
        })) ??
        (await tx.user.create({
          data: {
            name: admission.parentName.trim(),
            mobile,
            pin: parentPinHash,
            role: "parent",
            isActive: true,
            createdBy: actor.id,
          },
        }));

      const studentAccount = await tx.studentAccount.create({
        data: {
          userId: studentUser.id,
          studentName: admission.studentName.trim(),
          parentName: admission.parentName.trim(),
          mobile,
          username: usernameFromMobile("student", mobile),
          pin: studentPinHash,
          role: "student",
          programType,
          admissionStatus: "active",
          mentorId: mentor?.id ?? null,
          createdBy: actor.id,
        },
      });

      await tx.parentAccount.create({
        data: {
          userId: parentUser.id,
          name: admission.parentName.trim(),
          mobile,
          username: usernameFromMobile("parent", mobile),
          pin: parentPinHash,
          role: "parent",
          studentId: studentAccount.id,
          createdBy: actor.id,
        },
      });

      await tx.lead.update({
        where: { id: admission.leadId },
        data: {
          status: mentor ? "mentor_assigned" : "account_created",
          assignedMentorId: mentor?.id ?? null,
          notes: appendLeadNote(admission.lead.notes, {
            text: mentor
              ? `Backfilled approved admission and assigned mentor ${mentor.name} by round robin.`
              : "Backfilled approved admission, but no active mentor was available.",
            addedBy: "backfill-approved-pipeline-mentors",
          }),
        },
      });
    });

    created += 1;
    console.log(
      `Created student account for ${admission.studentName} -> ${
        mentor?.name ?? "no active mentor"
      }`,
    );
  }

  console.log(`Done. Created: ${created}. Skipped existing: ${skipped}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
