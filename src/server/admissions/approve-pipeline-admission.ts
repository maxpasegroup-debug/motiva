import prisma from "@/lib/prisma";
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

export type ApprovePipelineResult = {
  student: { id: string; mobile: string; pin: string; email: string; password: string };
  parent: { id: string; mobile: string; pin: string; email: string; password: string };
};

export async function approvePipelineAdmissionInDatabase(
  admissionId: string,
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

  try {
    const [student, parent] = await prisma.$transaction(async (tx) => {
      const studentUser = await tx.user.create({
        data: {
          name: row.student_name.trim(),
          mobile,
          pin: await hashPin(stPin),
          role: "student",
          isActive: true,
          createdBy: "pipeline-admission-approval",
        },
      });
      const parentUser = await tx.user.create({
        data: {
          name: row.parent_name.trim(),
          mobile,
          pin: await hashPin(parPin),
          role: "parent",
          isActive: true,
          createdBy: "pipeline-admission-approval",
        },
      });
      return [studentUser, parentUser];
    });

    if (getDatabaseUrl()) {
      try {
        const { upsertParentRecord, createParentNotification } = await import(
          "@/server/parents/parents-portal-db"
        );
        await upsertParentRecord({
          id: parent.id,
          name: row.parent_name.trim(),
          phone: row.phone.trim(),
          student_id: student.id,
          email: null,
        });
        await createParentNotification(
          parent.id,
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
          id: student.id,
          mobile,
          pin: stPin,
          email: mobile,
          password: stPin,
        },
        parent: {
          id: parent.id,
          mobile,
          pin: parPin,
          email: mobile,
          password: parPin,
        },
      },
    };
  } catch (error) {
    console.error("[approvePipelineAdmissionInDatabase]", error);
    await revertPipelineAdmissionToPending(admissionId);
    return { ok: false, error: "Could not create login accounts" };
  }
}
