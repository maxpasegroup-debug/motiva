import { redirect } from "next/navigation";
import { LearningPlanForm } from "@/components/mentor/LearningPlanForm";
import { parseLearningPlanSubjects } from "@/lib/mentor";
import { requireMentorSession } from "@/server/mentor/auth";
import { getMentorStudentDetail } from "@/server/mentor/data";

export const dynamic = "force-dynamic";

export default async function MentorStudentPlanPage({
  params,
}: {
  params: { studentId: string };
}) {
  const session = requireMentorSession();
  const detail = await getMentorStudentDetail(session.userId, params.studentId);

  if (!detail) {
    redirect("/mentor");
  }

  const existingPlan = detail.student.learningPlans[0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Learning Plan Builder</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Create or update the learning plan for {detail.student.studentName}.
        </p>
      </div>
      <LearningPlanForm
        studentId={detail.student.id}
        studentName={detail.student.studentName}
        existingPlan={
          existingPlan
            ? {
                id: existingPlan.id,
                startDate: existingPlan.startDate
                  ? existingPlan.startDate.toISOString().slice(0, 10)
                  : "",
                endDate: existingPlan.endDate
                  ? existingPlan.endDate.toISOString().slice(0, 10)
                  : "",
                status: existingPlan.status,
                goals: existingPlan.goals ?? "",
                revisionCycle: existingPlan.revisionCycle ?? "Every 7 days",
                notes: existingPlan.notes ?? "",
                subjects: parseLearningPlanSubjects(existingPlan.subjects),
              }
            : undefined
        }
      />
    </div>
  );
}
