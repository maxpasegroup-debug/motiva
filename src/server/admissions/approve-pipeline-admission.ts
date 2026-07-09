import {
  approvePipelineAdmission,
  getPipelineAdmissionById,
  revertPipelineAdmissionToPending,
} from "@/server/crm/leads-demos-admissions-db";
import { onboardPaidLead } from "@/server/admissions/onboard-paid-lead";

export type ApprovePipelineResult = {
  student: { id: string; mobile: string; pin: string | null; email: string; password: string | null };
  parent: { id: string; mobile: string; pin: string | null; email: string; password: string | null };
  studentAccount: { id: string; mentorId: string | null };
  mentor: { id: string; name: string } | null;
  teacher: { id: string; name: string } | null;
  batch: { id: string; name: string } | null;
  warnings: string[];
};

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

  const onboarding = await onboardPaidLead(
    row.lead_id,
    { id: actorId },
    {
      recordPayment: true,
      paymentNote: "Admission approved and payment recorded.",
    },
  );

  if (!onboarding.ok) {
    await revertPipelineAdmissionToPending(admissionId);
    return { ok: false, error: onboarding.error };
  }

  return {
    ok: true,
    data: {
      student: {
        id: onboarding.student.id,
        mobile: onboarding.student.mobile,
        pin: onboarding.student.pin,
        email: onboarding.student.mobile,
        password: onboarding.student.pin,
      },
      parent: {
        id: onboarding.parent.id,
        mobile: onboarding.parent.mobile,
        pin: onboarding.parent.pin,
        email: onboarding.parent.mobile,
        password: onboarding.parent.pin,
      },
      studentAccount: {
        id: onboarding.studentAccountId,
        mentorId: onboarding.mentor?.id ?? null,
      },
      mentor: onboarding.mentor,
      teacher: onboarding.teacher,
      batch: onboarding.batch,
      warnings: onboarding.warnings,
    },
  };
}
