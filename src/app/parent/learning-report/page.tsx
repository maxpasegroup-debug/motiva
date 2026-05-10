import { parseLearningPlanSubjects } from "@/lib/mentor";
import {
  calculatePercentage,
  formatPercentage,
  formatShortDate,
  moodLabel,
} from "@/lib/portal";
import { requireParentSession } from "@/server/parent/auth";
import { getParentChildProgress } from "@/server/parent/data";

export const dynamic = "force-dynamic";

function getAttendanceTone(percentage: number) {
  if (percentage >= 80) {
    return {
      label: "On track",
      className: "bg-emerald-100 text-emerald-800",
      note: "Attendance is strong. Keep the same routine at home.",
    };
  }
  if (percentage >= 60) {
    return {
      label: "Needs steady support",
      className: "bg-amber-100 text-amber-800",
      note: "Attendance is workable, but missed classes should be revised quickly.",
    };
  }
  return {
    label: "Needs urgent attention",
    className: "bg-rose-100 text-rose-800",
    note: "Attendance is weak. A counselor or mentor follow-up is recommended.",
  };
}

function getHomeActions(subjects: ReturnType<typeof parseLearningPlanSubjects>) {
  if (subjects.length === 0) {
    return [
      "Ask the mentor for the first written learning plan.",
      "Keep 20 minutes daily for revision until the plan is ready.",
      "Share the child's hardest subject with the teacher before the next class.",
    ];
  }

  return subjects.slice(0, 3).map((subject) => {
    const minutes = Math.max(15, subject.dailyTargetMinutes || 30);
    return `${subject.subjectName}: ${minutes} minutes daily practice. ${
      subject.notes || "Revise class examples and ask one doubt."
    }`;
  });
}

export default async function ParentLearningReportPage() {
  const session = requireParentSession();
  const snapshot = await getParentChildProgress(session.userId);

  if (!snapshot) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        Parent profile not found.
      </div>
    );
  }

  const presentCount = snapshot.attendance.filter(
    (record) => record.status === "present",
  ).length;
  const absentCount = snapshot.attendance.filter(
    (record) => record.status === "absent",
  ).length;
  const attendancePercentage = calculatePercentage(presentCount, absentCount);
  const attendanceTone = getAttendanceTone(attendancePercentage);
  const plan = snapshot.latestPlan;
  const subjects = plan ? parseLearningPlanSubjects(plan.subjects) : [];
  const homeActions = getHomeActions(subjects);
  const lastMood = snapshot.mood[snapshot.mood.length - 1] ?? null;
  const nextClass = snapshot.schedule.find((schedule) => {
    if (!schedule.scheduledDate) return false;
    return new Date(schedule.scheduledDate) >= new Date(new Date().toDateString());
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Parent Learning Report
            </p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-900">
              {snapshot.child.studentName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              A simple parent-readable report covering attendance, learning plan,
              home actions, and the next class focus.
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${attendanceTone.className}`}
          >
            {attendanceTone.label}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Overall Attendance"
          value={formatPercentage(attendancePercentage)}
        />
        <MetricCard label="Present" value={String(presentCount)} />
        <MetricCard label="Absent" value={String(absentCount)} />
        <MetricCard
          label="Plan Status"
          value={plan?.status ? plan.status.replace(/_/g, " ") : "Not ready"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">
            Learning Gap Plan
          </h2>
          {plan ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <SmallInfo label="Start" value={formatShortDate(plan.startDate)} />
                <SmallInfo label="End" value={formatShortDate(plan.endDate)} />
                <SmallInfo
                  label="Revision"
                  value={plan.revisionCycle ?? "Not set"}
                />
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                  Goals
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-700">
                  {plan.goals || "Goals are not added yet."}
                </p>
              </div>
              <div className="space-y-3">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <div
                      key={`${subject.subjectName}-${subject.dailyTargetMinutes}`}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-neutral-900">
                          {subject.subjectName}
                        </p>
                        <span className="text-sm font-semibold text-blue-700">
                          {subject.dailyTargetMinutes} min/day
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {subject.notes || "Practice target added."}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
                    Subject targets are not added yet.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm leading-6 text-neutral-500">
              The mentor has not published a learning plan yet. Until then, keep a
              fixed daily revision time and note the child&apos;s hardest doubts.
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">
              Parent Home Actions
            </h2>
            <ol className="mt-5 space-y-3">
              {homeActions.map((action, index) => (
                <li
                  key={action}
                  className="flex gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-700"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">
              Next Class Focus
            </h2>
            {nextClass ? (
              <div className="mt-5 rounded-2xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
                <p className="font-semibold text-neutral-900">
                  {formatShortDate(nextClass.scheduledDate)}
                </p>
                <p className="mt-1">
                  {nextClass.scheduledTime ?? "Time not set"} -{" "}
                  {nextClass.subject ?? nextClass.topic ?? "Subject not set"}
                </p>
                <p className="mt-2 text-neutral-500">
                  Parent tip: ask the child to revise the last class before this
                  session.
                </p>
              </div>
            ) : (
              <p className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
                No upcoming class is scheduled yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">
            Wellbeing Signal
          </h2>
          <p className="mt-4 text-sm leading-6 text-neutral-600">
            {lastMood
              ? `Latest mood check-in: ${moodLabel(lastMood.rating)} (${lastMood.rating}/5).`
              : "No wellbeing check-in has been recorded yet."}
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">
            Attendance Interpretation
          </h2>
          <p className="mt-4 text-sm leading-6 text-neutral-700">
            {attendanceTone.note}
          </p>
          <div className="mt-5 grid grid-cols-10 gap-2">
            {snapshot.attendance.slice(0, 30).map((record) => (
              <div
                key={record.id}
                title={`Day ${record.dayNumber}: ${record.status}`}
                className={`h-8 rounded-lg ${
                  record.status === "present" ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-3 text-2xl font-bold capitalize text-neutral-900">{value}</p>
    </div>
  );
}

function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
