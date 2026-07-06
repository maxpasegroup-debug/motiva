import prisma from "@/lib/prisma";
import { appendLeadNote, determineProgramTypeFromLead } from "@/lib/leads";
import {
  determineMentorCategory,
  normalizeMentorCategory,
  type MentorCategory,
} from "@/lib/mentor-categories";
import { hashPin, normalizeMobile } from "@/server/auth/unified-auth";

function randomPin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function usernameFromMobile(prefix: string, mobile: string) {
  return `${prefix}_${mobile}`;
}

function getDatabaseTarget(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return "DATABASE_URL is not set";

  try {
    const url = new URL(databaseUrl);
    const user = url.username || "unknown";
    const db = url.pathname.replace(/^\//, "") || "unknown";
    return `${url.hostname}:${url.port || "default"}/${db} as ${user}`;
  } catch {
    return "DATABASE_URL is set but could not be parsed";
  }
}

async function pickRoundRobinMentor(category: MentorCategory) {
  const allMentors = await prisma.user.findMany({
    where: { role: "mentor", isActive: true },
    select: { id: true, name: true, createdAt: true, profileData: true },
    orderBy: { createdAt: "asc" },
  });
  const mentors = allMentors.filter((mentor) => {
    const profile =
      mentor.profileData &&
      typeof mentor.profileData === "object" &&
      !Array.isArray(mentor.profileData)
        ? (mentor.profileData as Record<string, unknown>)
        : {};

    return normalizeMentorCategory(profile.mentorCategory) === category;
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

    const studentPin = randomPin();
    let parentPin = randomPin();
    if (parentPin === studentPin) parentPin = randomPin();
    const studentPinHash = await hashPin(studentPin);
    const parentPinHash = await hashPin(parentPin);
    const programType = determineProgramTypeFromLead({
      type: admission.type,
      notes: admission.notes,
    });
    const mentorCategory = determineMentorCategory({
      type: admission.lead.type ?? admission.type,
      flowType: admission.lead.flowType,
      subjects: admission.lead.subjects,
      notes: [admission.lead.notes, admission.notes].filter(Boolean).join("\n"),
    });
    const mentor = await pickRoundRobinMentor(mentorCategory);

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
              ? `Backfilled approved admission and assigned ${mentorCategory} mentor ${mentor.name} by round robin.`
              : `Backfilled approved admission, but no active ${mentorCategory} mentor was available.`,
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
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("Authentication failed against database server")) {
      console.error(
        [
          "Database authentication failed while running the admission mentor backfill.",
          `Configured database: ${getDatabaseTarget()}`,
          "Refresh DATABASE_URL in .env with the current Railway/Postgres connection string, then rerun:",
          "npx tsx scripts/backfill-approved-pipeline-mentors.ts",
        ].join("\n"),
      );
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
