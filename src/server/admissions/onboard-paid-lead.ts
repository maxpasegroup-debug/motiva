import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { appendLeadNote, determineProgramTypeFromLead } from "@/lib/leads";
import {
  determineMentorCategory,
  normalizeMentorCategory,
  type MentorCategory,
} from "@/lib/mentor-categories";
import { sendCredentials } from "@/lib/whatsapp";
import { hashPin, normalizeMobile } from "@/server/auth/unified-auth";

type Tx = Prisma.TransactionClient;

type AssignedUser = { id: string; name: string } | null;
type AssignedBatch = { id: string; name: string } | null;

export type OnboardPaidLeadResult =
  | {
      ok: true;
      leadStatus: "mentor_assigned" | "account_created";
      studentAccountId: string;
      student: { id: string; mobile: string; pin: string | null };
      parent: { id: string; mobile: string; pin: string | null };
      mentor: AssignedUser;
      teacher: AssignedUser;
      batch: AssignedBatch;
      warnings: string[];
    }
  | { ok: false; error: string };

function randomPin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function usernameFromMobile(prefix: string, mobile: string) {
  return `${prefix}_${mobile}`;
}

function profileObject(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function determineStudentProgramType(input: {
  type?: string | null;
  flowType?: string | null;
  subjects?: string | null;
  notes?: string | null;
}) {
  const category = determineMentorCategory(input);
  if (category === "spoken_english") return "spoken_english";
  if (category === "madrassa") return "madrassa";
  if (category === "foundation") {
    const remedialType = determineProgramTypeFromLead({
      type: input.flowType === "remedial" ? "remedial" : input.type,
      notes: [input.subjects, input.notes].filter(Boolean).join("\n"),
    });
    return remedialType === "tuition" ? "foundation" : remedialType;
  }
  return "tuition";
}

async function pickRoundRobinMentor(
  tx: Tx,
  category: MentorCategory,
): Promise<AssignedUser> {
  const allMentors = await tx.user.findMany({
    where: { role: "mentor", isActive: true },
    select: { id: true, name: true, createdAt: true, profileData: true },
    orderBy: { createdAt: "asc" },
  });
  const mentors = allMentors.filter((mentor) => {
    const profile = profileObject(mentor.profileData);
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

function teacherMatchScore(
  teacher: { name: string; profileData: Prisma.JsonValue | null },
  haystack: string,
  category: MentorCategory,
) {
  const profile = profileObject(teacher.profileData);
  const subject =
    typeof profile.subject === "string" ? profile.subject.toLowerCase() : "";
  const name = teacher.name.toLowerCase();
  const categoryTerms: Record<MentorCategory, string[]> = {
    foundation: ["foundation", "remedial"],
    tuition: ["tuition", "math", "science", "english"],
    spoken_english: ["spoken", "english", "public speaking"],
    madrassa: ["madrassa", "madrasa"],
  };

  let score = 0;
  for (const term of categoryTerms[category]) {
    if (subject.includes(term) || name.includes(term)) score += 3;
    if (haystack.includes(term)) score += 1;
  }
  if (subject && haystack.includes(subject)) score += 5;
  return score;
}

async function pickRoundRobinTeacher(
  tx: Tx,
  input: {
    category: MentorCategory;
    subjects?: string | null;
    notes?: string | null;
    type?: string | null;
  },
): Promise<AssignedUser> {
  const teachers = await tx.user.findMany({
    where: { role: "teacher", isActive: true },
    select: { id: true, name: true, createdAt: true, profileData: true },
    orderBy: { createdAt: "asc" },
  });
  if (teachers.length === 0) return null;

  const counts = await tx.studentAccount.groupBy({
    by: ["teacherId"],
    where: {
      teacherId: { in: teachers.map((teacher) => teacher.id) },
      admissionStatus: "active",
    },
    _count: { _all: true },
  });
  const countByTeacher = new Map(
    counts.map((row) => [row.teacherId, row._count._all]),
  );
  const haystack = [input.type, input.subjects, input.notes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return teachers
    .map((teacher) => ({
      ...teacher,
      score: teacherMatchScore(teacher, haystack, input.category),
      studentCount: countByTeacher.get(teacher.id) ?? 0,
    }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.studentCount !== b.studentCount) return a.studentCount - b.studentCount;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })[0];
}

function expectedBatchDuration(programType: string) {
  if (programType === "remedial_25") return 25;
  if (programType === "remedial_12") return 12;
  return null;
}

async function pickBatchForTeacher(
  tx: Tx,
  teacherId: string | null,
  programType: string,
): Promise<AssignedBatch> {
  if (!teacherId) return null;

  const duration = expectedBatchDuration(programType);
  const batches = await tx.batch.findMany({
    where: {
      teacherId,
      ...(duration ? { duration } : {}),
    },
    select: {
      id: true,
      name: true,
      duration: true,
      createdAt: true,
      _count: { select: { students: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (batches.length === 0) return null;

  return batches
    .sort((a, b) => {
      if (a._count.students !== b._count.students) {
        return a._count.students - b._count.students;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map((batch) => ({ id: batch.id, name: batch.name }))[0];
}

async function ensurePaidPaymentRecord(
  tx: Tx,
  input: {
    leadId: string;
    studentId: string;
    studentName: string;
    courseLabel: string;
    amountCents: number;
    currency: string;
    recordedBy: string;
    notes: string;
  },
) {
  if (input.amountCents <= 0) return;

  const paid = await tx.paymentTransaction.aggregate({
    where: { leadId: input.leadId, status: "paid" },
    _sum: { amountCents: true },
  });
  if ((paid._sum.amountCents ?? 0) >= input.amountCents) return;

  await tx.paymentTransaction.create({
    data: {
      leadId: input.leadId,
      studentId: input.studentId,
      studentName: input.studentName,
      courseLabel: input.courseLabel,
      amountCents: input.amountCents - (paid._sum.amountCents ?? 0),
      currency: input.currency,
      status: "paid",
      notes: input.notes,
      recordedBy: input.recordedBy,
    },
  });
}

export async function onboardPaidLead(
  leadId: string,
  actor: { id: string; name?: string | null; role?: string | null },
  options: {
    recordPayment?: boolean;
    paymentNote?: string;
    preferredMentorId?: string | null;
    preferredTeacherId?: string | null;
    preferredBatchId?: string | null;
  } = {},
): Promise<OnboardPaidLeadResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({
        where: { id: leadId },
        include: {
          admissions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });

      if (!lead) throw new Error("Lead not found");
      const admission = lead.admissions[0] ?? null;
      if (!admission) {
        throw new Error("Admission record is required before onboarding");
      }
      if (options.recordPayment && (admission.feeAmountCents ?? 0) <= 0) {
        throw new Error("Admission fee must be set before confirming payment");
      }

      const mobile = normalizeMobile(admission.phone || lead.phone);
      if (!mobile) throw new Error("Student mobile is invalid");

      const parentMobile = mobile;
      const studentPin = randomPin();
      let parentPin = randomPin();
      if (parentPin === studentPin) parentPin = randomPin();
      const studentPinHash = await hashPin(studentPin);
      const parentPinHash = await hashPin(parentPin);
      const notes = [lead.notes, admission.notes].filter(Boolean).join("\n");
      const mentorCategory = determineMentorCategory({
        type: lead.type,
        flowType: lead.flowType,
        subjects: lead.subjects,
        notes,
      });
      const programType = determineStudentProgramType({
        type: lead.type,
        flowType: lead.flowType,
        subjects: lead.subjects,
        notes,
      });

      const preferredMentor = options.preferredMentorId
        ? await tx.user.findFirst({
            where: {
              id: options.preferredMentorId,
              role: "mentor",
              isActive: true,
            },
            select: { id: true, name: true },
          })
        : null;
      const mentor =
        preferredMentor ?? (await pickRoundRobinMentor(tx, mentorCategory));
      const preferredTeacher = options.preferredTeacherId
        ? await tx.user.findFirst({
            where: {
              id: options.preferredTeacherId,
              role: "teacher",
              isActive: true,
            },
            select: { id: true, name: true },
          })
        : null;
      const teacher =
        preferredTeacher ??
        (await pickRoundRobinTeacher(tx, {
          category: mentorCategory,
          subjects: lead.subjects,
          notes,
          type: lead.type,
        }));
      const preferredBatch = options.preferredBatchId
        ? await tx.batch.findFirst({
            where: {
              id: options.preferredBatchId,
              ...(teacher?.id ? { teacherId: teacher.id } : {}),
            },
            select: { id: true, name: true },
          })
        : null;
      const batch =
        preferredBatch ??
        (await pickBatchForTeacher(tx, teacher?.id ?? null, programType));

      const existingStudentAccount = await tx.studentAccount.findUnique({
        where: { mobile },
        include: { parentAccounts: true },
      });
      const existingStudentUser = await tx.user.findFirst({
        where: { mobile, role: "student" },
      });
      const existingParentUser = await tx.user.findFirst({
        where: { mobile: parentMobile, role: "parent" },
      });

      const studentUser =
        existingStudentUser ??
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
        existingParentUser ??
        (await tx.user.create({
          data: {
            name: admission.parentName.trim(),
            mobile: parentMobile,
            pin: parentPinHash,
            role: "parent",
            isActive: true,
            createdBy: actor.id,
          },
        }));

      const studentAccount =
        existingStudentAccount ??
        (await tx.studentAccount.create({
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
            teacherId: teacher?.id ?? null,
            batchId: batch?.id ?? null,
            createdBy: actor.id,
          },
        }));

      if (existingStudentAccount) {
        await tx.studentAccount.update({
          where: { id: existingStudentAccount.id },
          data: {
            userId: existingStudentAccount.userId ?? studentUser.id,
            programType: existingStudentAccount.programType || programType,
            admissionStatus: "active",
            mentorId: existingStudentAccount.mentorId ?? mentor?.id ?? null,
            teacherId: existingStudentAccount.teacherId ?? teacher?.id ?? null,
            batchId: existingStudentAccount.batchId ?? batch?.id ?? null,
          },
        });
      }

      const hasParentAccount =
        existingStudentAccount?.parentAccounts.some(
          (account) => account.mobile === parentMobile,
        ) ?? false;
      if (!hasParentAccount) {
        const existingParentAccount = await tx.parentAccount.findUnique({
          where: { mobile: parentMobile },
          select: { id: true },
        });
        if (!existingParentAccount) {
          await tx.parentAccount.create({
            data: {
              userId: parentUser.id,
              name: admission.parentName.trim(),
              mobile: parentMobile,
              username: usernameFromMobile("parent", parentMobile),
              pin: parentPinHash,
              role: "parent",
              studentId: studentAccount.id,
              createdBy: actor.id,
            },
          });
        }
      }

      await tx.parent.upsert({
        where: { id: parentUser.id },
        update: {
          name: admission.parentName.trim(),
          phone: parentMobile,
          phoneNormalized: parentMobile,
          studentId: studentAccount.id,
          email: null,
        },
        create: {
          id: parentUser.id,
          name: admission.parentName.trim(),
          phone: parentMobile,
          phoneNormalized: parentMobile,
          studentId: studentAccount.id,
          email: null,
        },
      });

      if (batch && studentUser.id) {
        await tx.batchStudent.deleteMany({ where: { studentId: studentUser.id } });
        await tx.batchStudent.create({
          data: { studentId: studentUser.id, batchId: batch.id },
        });
      }

      if (options.recordPayment) {
        await ensurePaidPaymentRecord(tx, {
          leadId: lead.id,
          studentId: studentAccount.id,
          studentName: admission.studentName.trim(),
          courseLabel: lead.subjects || admission.type || programType,
          amountCents: admission.feeAmountCents ?? 0,
          currency: admission.feeCurrency ?? "INR",
          recordedBy: actor.name || actor.id,
          notes: options.paymentNote ?? "Payment confirmed from lead tracker.",
        });
      }

      const warnings = [
        mentor ? null : `No active ${mentorCategory} mentor was available.`,
        teacher ? null : "No active teacher was available.",
        batch ? null : "No matching batch was available.",
        options.preferredMentorId && !preferredMentor
          ? "Selected mentor was not available."
          : null,
        options.preferredTeacherId && !preferredTeacher
          ? "Selected teacher was not available."
          : null,
        options.preferredBatchId && !preferredBatch
          ? "Selected batch was not available for the teacher."
          : null,
      ].filter((item): item is string => Boolean(item));
      const finalStatus: "mentor_assigned" | "account_created" =
        mentor && teacher && batch ? "mentor_assigned" : "account_created";

      await tx.admission.update({
        where: { id: admission.id },
        data: { status: "approved" },
      });
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: finalStatus,
          assignedMentorId: mentor?.id ?? lead.assignedMentorId,
          notes: appendLeadNote(lead.notes, {
            text: [
              "Payment recorded. Student and parent dashboards created.",
              mentor ? `Mentor assigned: ${mentor.name}.` : null,
              teacher ? `Teacher assigned: ${teacher.name}.` : null,
              batch ? `Batch assigned: ${batch.name}.` : null,
              warnings.length ? `Needs admin action: ${warnings.join(" ")}` : null,
            ]
              .filter(Boolean)
              .join(" "),
            addedBy: actor.name || actor.id,
          }),
        },
      });

      return {
        leadStatus: finalStatus,
        studentAccountId: studentAccount.id,
        student: {
          id: studentUser.id,
          mobile,
          pin: existingStudentUser ? null : studentPin,
        },
        parent: {
          id: parentUser.id,
          mobile: parentMobile,
          pin: existingParentUser ? null : parentPin,
        },
        mentor,
        teacher,
        batch,
        warnings,
      };
    });

    if (result.student.pin) {
      try {
        await sendCredentials(
          result.student.mobile,
          "Student",
          result.student.mobile,
          result.student.pin,
        );
      } catch (error) {
        console.error("[onboardPaidLead send student credentials]", error);
      }
    }
    if (result.parent.pin) {
      try {
        await sendCredentials(
          result.parent.mobile,
          "Parent",
          result.parent.mobile,
          result.parent.pin,
        );
      } catch (error) {
        console.error("[onboardPaidLead send parent credentials]", error);
      }
    }

    return { ok: true, ...result };
  } catch (error) {
    console.error("[onboardPaidLead]", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not onboard student",
    };
  }
}
