import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { appendLeadNote, determineProgramTypeFromLead } from "@/lib/leads";
import {
  determineMentorCategory,
  normalizeMentorCategory,
  type MentorCategory,
} from "@/lib/mentor-categories";
import {
  approvePipelineAdmission,
  getPipelineAdmissionById,
  revertPipelineAdmissionToPending,
} from "@/server/crm/leads-demos-admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";
import { hashPin, normalizeMobile } from "@/server/auth/unified-auth";

function randomPin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function usernameFromMobile(prefix: string, mobile: string) {
  return `${prefix}_${mobile}`;
}

export type ApprovePipelineResult = {
  student: { id: string; mobile: string; pin: string; email: string; password: string };
  parent: { id: string; mobile: string; pin: string; email: string; password: string };
  studentAccount: { id: string; mentorId: string | null };
  mentor: { id: string; name: string } | null;
};

type Tx = Prisma.TransactionClient;

async function pickRoundRobinMentor(
  tx: Tx,
  category: MentorCategory,
): Promise<{ id: string; name: string } | null> {
  const allMentors = await tx.user.findMany({
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

  const counts = await tx.studentAccount.groupBy({
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

export async function approvePipelineAdmissionInDatabase(
  admissionId: string,
  actorId: string,
): Promise<
  { ok: true; data: ApprovePipelineResult } | { ok: false; error: string }
> {
  const row = await getPipelineAdmissionById(admissionId);
  if (!row) return { ok: false, error: "Admission not found" };
  if (row.status !== "pending") {
    return {
      ok: false,
      error:
        row.status === "approved"
          ? "Already approved"
          : "Admission is not pending",
    };
  }

  const approved = await approvePipelineAdmission(admissionId);
  if (!approved) {
    return { ok: false, error: "Already processed" };
  }

  const mobile = normalizeMobile(row.phone);
  const stPin = randomPin();
  let parPin = randomPin();
  if (parPin === stPin) parPin = randomPin();
  const stPinHash = await hashPin(stPin);
  const parPinHash = await hashPin(parPin);
  const programType = determineProgramTypeFromLead({
    type: row.type,
    notes: row.notes,
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [existingStudentAccount, existingParentAccount] = await Promise.all([
        tx.studentAccount.findUnique({ where: { mobile }, select: { id: true } }),
        tx.parentAccount.findUnique({ where: { mobile }, select: { id: true } }),
      ]);
      if (existingStudentAccount) {
        throw new Error("Student mobile already exists");
      }
      if (existingParentAccount) {
        throw new Error("Parent mobile already exists");
      }

      const lead = await tx.lead.findUnique({
        where: { id: row.lead_id },
        select: {
          id: true,
          type: true,
          flowType: true,
          subjects: true,
          notes: true,
        },
      });
      const mentorCategory = determineMentorCategory({
        type: lead?.type ?? row.type,
        flowType: lead?.flowType,
        subjects: lead?.subjects,
        notes: [lead?.notes, row.notes].filter(Boolean).join("\n"),
      });
      const mentor = await pickRoundRobinMentor(tx, mentorCategory);

      const studentUser = await tx.user.create({
        data: {
          name: row.student_name.trim(),
          mobile,
          pin: stPinHash,
          role: "student",
          isActive: true,
          createdBy: actorId,
        },
      });
      const parentUser = await tx.user.create({
        data: {
          name: row.parent_name.trim(),
          mobile,
          pin: parPinHash,
          role: "parent",
          isActive: true,
          createdBy: actorId,
        },
      });

      const studentAccount = await tx.studentAccount.create({
        data: {
          userId: studentUser.id,
          studentName: row.student_name.trim(),
          parentName: row.parent_name.trim(),
          mobile,
          username: usernameFromMobile("student", mobile),
          pin: stPinHash,
          role: "student",
          programType,
          admissionStatus: "active",
          mentorId: mentor?.id ?? null,
          createdBy: actorId,
        },
      });

      await tx.parentAccount.create({
        data: {
          userId: parentUser.id,
          name: row.parent_name.trim(),
          mobile,
          username: usernameFromMobile("parent", mobile),
          pin: parPinHash,
          role: "parent",
          studentId: studentAccount.id,
          createdBy: actorId,
        },
      });

      if (lead) {
        await tx.lead.update({
          where: { id: lead.id },
          data: {
            status: mentor ? "mentor_assigned" : "account_created",
            assignedMentorId: mentor?.id ?? null,
            notes: appendLeadNote(lead.notes, {
              text: mentor
                ? `Admission approved. Student account created and assigned to ${mentorCategory} mentor ${mentor.name} by round robin.`
                : `Admission approved. Student account created, but no active ${mentorCategory} mentor was available for assignment.`,
              addedBy: actorId,
            }),
          },
        });
      }

      return { studentUser, parentUser, studentAccount, mentor };
    });

    if (getDatabaseUrl()) {
      try {
        const { upsertParentRecord, createParentNotification } = await import(
          "@/server/parents/parents-portal-db"
        );
        await upsertParentRecord({
          id: result.parentUser.id,
          name: row.parent_name.trim(),
          phone: row.phone.trim(),
          student_id: result.studentUser.id,
          email: null,
        });
        await createParentNotification(
          result.parentUser.id,
          "Your child has been enrolled successfully.",
        );
      } catch (e) {
        console.error("[approvePipelineAdmissionInDatabase] parent portal", e);
      }
    }

    return {
      ok: true,
      data: {
        student: {
          id: result.studentUser.id,
          mobile,
          pin: stPin,
          email: mobile,
          password: stPin,
        },
        parent: {
          id: result.parentUser.id,
          mobile,
          pin: parPin,
          email: mobile,
          password: parPin,
        },
        studentAccount: {
          id: result.studentAccount.id,
          mentorId: result.studentAccount.mentorId,
        },
        mentor: result.mentor
          ? { id: result.mentor.id, name: result.mentor.name }
          : null,
      },
    };
  } catch (error) {
    console.error("[approvePipelineAdmissionInDatabase]", error);
    await revertPipelineAdmissionToPending(admissionId);
    return { ok: false, error: "Could not create login accounts" };
  }
}
