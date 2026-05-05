import prisma from "@/lib/prisma";
import {
  getAdmissionRequestById,
  updateAdmissionRequestStatus,
  updateAdmissionRequestStatusIfPending,
} from "@/server/admissions/admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";
import { hashPin, normalizeMobile } from "@/server/auth/unified-auth";

function randomPin(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

export type ApproveAdmissionResult = {
  student: { id: string; mobile: string; pin: string; email: string; password: string };
  parent: { id: string; mobile: string; pin: string; email: string; password: string };
};

export async function approveAdmissionInDatabase(
  admissionId: string,
): Promise<
  { ok: true; data: ApproveAdmissionResult } | { ok: false; error: string }
> {
  const row = await getAdmissionRequestById(admissionId);
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

  const claimed = await updateAdmissionRequestStatusIfPending(
    admissionId,
    "approved",
  );
  if (!claimed) {
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
          createdBy: "legacy-admission-approval",
        },
      });
      const parentUser = await tx.user.create({
        data: {
          name: row.parent_name.trim(),
          mobile,
          pin: await hashPin(parPin),
          role: "parent",
          isActive: true,
          createdBy: "legacy-admission-approval",
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
        console.error("[approveAdmissionInDatabase] parent portal", e);
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
    console.error("[approveAdmissionInDatabase]", error);
    await updateAdmissionRequestStatus(admissionId, "pending");
    return { ok: false, error: "Could not create login accounts" };
  }
}
