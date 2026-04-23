import { parseLearningPlanSubjects } from "@/lib/mentor";
import { formatShortDate } from "@/lib/portal";
import { requireStudentSession } from "@/server/student/auth";
import { getStudentPlan } from "@/server/student/data";

export const dynamic = "force-dynamic";

export default async function StudentMyPlanPage() {
  const session = requireStudentSession();
  const plan = await getStudentPlan(session.userId);

  if (!plan) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-neutral-900">My Learning Plan</h1>
        <p className="mt-4 text-sm text-neutral-500">No plan assigned yet.</p>
      </div>
    );
  }

  const subjects = parseLearningPlanSubjects(plan.subjects);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">My Learning Plan</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Read-only view of your current learning targets.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <PlanInfo label="Status" value={plan.status} />
        <PlanInfo label="Start Date" value={formatShortDate(plan.startDate)} />
        <PlanInfo label="End Date" value={formatShortDate(plan.endDate)} />
        <PlanInfo label="Revision Cycle" value={plan.revisionCycle ?? "Not set"} />
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">Subjects</h2>
        <div className="mt-4 space-y-3">
          {subjects.map((subject) => (
            <div key={`${subject.subjectName}-${subject.dailyTargetMinutes}`} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-neutral-900">{subject.subjectName}</p>
                <span className="text-sm text-neutral-500">
                  {subject.dailyTargetMinutes} min/day
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {subject.notes || "No notes for this subject."}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Goals</h2>
          <p className="mt-4 text-sm text-neutral-700">
            {plan.goals || "No goals shared yet."}
          </p>
        </div>
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Mentor Notes</h2>
          <p className="mt-4 text-sm text-neutral-700">
            {plan.notes || "No notes available."}
          </p>
        </div>
      </section>
    </div>
  );
}

function PlanInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-3 text-lg font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
