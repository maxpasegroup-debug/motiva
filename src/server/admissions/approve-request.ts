import bcrypt from "bcrypt";
import {
  createUserAsAdmin,
  deleteUserAsAdmin,
} from "@/server/auth/auth-users-store";
import {
  getAdmissionRequestById,
  updateAdmissionRequestStatus,
  updateAdmissionRequestStatusIfPending,
} from "@/server/admissions/admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";

function randomPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 10; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function studentEmailFromName(name: string, suffix: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${slug || "student"}${n}${suffix}@motiva.local`;
}

function parentEmailFromPhone(phone: string, unique: string) {
  const digits = phone.replace(/\D/g, "").slice(-14) || "0";
  return `parent.${digits}.${unique.slice(0, 12)}@motiva.local`;
}

export type ApproveAdmissionResult = {
  student: { id: string; email: string; password: string };
  parent: { id: string; email: string; password: string };
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

  const stPass = randomPassword();
  const parPass = randomPassword();
  const uniqueBase = admissionId.replace(/-/g, "").slice(0, 16);
  const stHash = await bcrypt.hash(stPass, 10);
  const parHash = await bcrypt.hash(parPass, 10);

  let studentCreated = undefined as
    | Awaited<ReturnType<typeof createUserAsAdmin>>
    | undefined;

  for (let i = 0; i < 8; i++) {
    const namePart = i === 0 ? row.student_name : `${row.student_name} ${i}`;
    const studentEmail = studentEmailFromName(namePart, ".s");
    const attempt = await createUserAsAdmin({
      name: row.student_name.trim(),
      email: studentEmail,
      passwordHash: stHash,
      role: "student",
    });
    if (attempt.ok) {
      studentCreated = attempt;
      break;
    }
    if (attempt.error !== "Email already exists") {
      await updateAdmissionRequestStatus(admissionId, "pending");
      return { ok: false, error: attempt.error };
    }
  }

  if (!studentCreated?.ok) {
    await updateAdmissionRequestStatus(admissionId, "pending");
    return { ok: false, error: "Could not create student login" };
  }

  let parentCreated = undefined as
    | Awaited<ReturnType<typeof createUserAsAdmin>>
    | undefined;

  for (let j = 0; j < 8; j++) {
    const parentEmail = parentEmailFromPhone(
      row.phone,
      j === 0 ? uniqueBase : `${uniqueBase}${j}`,
    );
    const attempt = await createUserAsAdmin({
      name: row.parent_name.trim(),
      email: parentEmail,
      passwordHash: parHash,
      role: "parent",
    });
    if (attempt.ok) {
      parentCreated = attempt;
      break;
    }
    if (attempt.error !== "Email already exists") {
      await deleteUserAsAdmin(studentCreated.user.id);
      await updateAdmissionRequestStatus(admissionId, "pending");
      return { ok: false, error: attempt.error };
    }
  }

  if (!parentCreated?.ok) {
    await deleteUserAsAdmin(studentCreated.user.id);
    await updateAdmissionRequestStatus(admissionId, "pending");
    return {
      ok: false,
      error:
        parentCreated && !parentCreated.ok
          ? parentCreated.error
          : "Could not create parent login",
    };
  }

  if (getDatabaseUrl()) {
    try {
      const { upsertParentRecord, createParentNotification } = await import(
        "@/server/parents/parents-portal-db"
      );
      await upsertParentRecord({
        id: parentCreated.user.id,
        name: row.parent_name.trim(),
        phone: row.phone.trim(),
        student_id: studentCreated.user.id,
        email: null,
      });
      await createParentNotification(
        parentCreated.user.id,
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
        id: studentCreated.user.id,
        email: studentCreated.user.email,
        password: stPass,
      },
      parent: {
        id: parentCreated.user.id,
        email: parentCreated.user.email,
        password: parPass,
      },
    },
  };
}
