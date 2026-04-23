import Link from "next/link";
import { parseLearningPlanSubjects } from "@/lib/mentor";
import {
  formatPercentage,
  formatShortDate,
  getAttendanceSquareClass,
} from "@/lib/portal";
import { StudentMoodCheckIn } from "@/components/student/StudentMoodCheckIn";
import { requireStudentSession } from "@/server/student/auth";
import { getStudentPortalSnapshot } from "@/server/student/data";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const session = requireStudentSession();
  const snapshot = await getStudentPortalSnapshot(session.userId);

  if (!snapshot) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        Student profile not found.
      </div>
    );
  }

  const planSubjects = snapshot.learningPlan
    ? parseLearningPlanSubjects(snapshot.learningPlan.subjects)
    : [];
  const recentRecords = snapshot.recentAttendance.slice(0, 30);
  const heatmap = Array.from({ length: 30 }, (_, index) => {
    const record = recentRecords[index];
    return record?.status === "present"
      ? "present"
      : record?.status === "absent"
        ? "absent"
        : "empty";
  });
  const recentPresent = recentRecords.filter((record) => record.status === "present").length;
  const recentAbsent = recentRecords.filter((record) => record.status === "absent").length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-500">Student Portal</p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-900">
              Welcome back, {snapshot.student.studentName}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
              {snapshot.student.programType}
            </span>
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              {snapshot.student.admissionStatus}
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Current Day"
          value={
            snapshot.student.batch?.progress?.currentDay
              ? `Day ${snapshot.student.batch.progress.currentDay}`
              : "Not in batch yet"
          }
        />
        <MetricCard
          label="Total Days"
          value={snapshot.student.batch?.duration ? String(snapshot.student.batch.duration) : "—"}
        />
        <MetricCard
          label="Attendance %"
          value={formatPercentage(snapshot.attendancePercentage)}
        />
        <MetricCard
          label="Learning Plan"
          value={snapshot.learningPlan?.status ?? "none"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Attendance Heatmap</h2>
              <p className="mt-1 text-sm text-neutral-500">Your latest 30 attendance entries.</p>
            </div>
            <Link href="/student/attendance" className="text-sm font-semibold text-neutral-900">
              View full history
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-10 gap-2">
            {heatmap.map((status, index) => (
              <div
                key={`attendance-${index}`}
                className={`h-7 rounded-lg ${getAttendanceSquareClass(status)}`}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-neutral-600">
            {recentPresent} present, {recentAbsent} absent out of{" "}
            {recentPresent + recentAbsent} days
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">Today&apos;s Class</h2>
            <div className="mt-4 space-y-3">
              {snapshot.todayClasses.length > 0 ? (
                snapshot.todayClasses.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <p className="text-sm font-semibold text-neutral-900">
                      {schedule.scheduledTime ?? "Time not set"}
                    </p>
                    <p className="mt-2 text-sm text-neutral-700">
                      {schedule.subject ?? schedule.topic ?? "Subject not set"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {schedule.teacherName}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
                  No class scheduled today.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">Daily Mood Check-In</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Share how you are feeling today in one tap.
            </p>
            <div className="mt-4">
              <StudentMoodCheckIn
                existingMood={
                  snapshot.todayMood
                    ? {
                        rating: snapshot.todayMood.rating,
                        date: formatShortDate(snapshot.todayMood.date),
                      }
                    : null
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">My Learning Plan</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Daily targets and goals set by your mentor.
              </p>
            </div>
            <Link href="/student/my-plan" className="text-sm font-semibold text-neutral-900">
              Open full plan
            </Link>
          </div>

          {snapshot.learningPlan ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Status" value={snapshot.learningPlan.status} />
                <InfoCard
                  label="Revision Cycle"
                  value={snapshot.learningPlan.revisionCycle ?? "Not set"}
                />
              </div>
              <div className="space-y-3">
                {planSubjects.map((subject) => (
                  <div
                    key={`${subject.subjectName}-${subject.dailyTargetMinutes}`}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
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
              <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
                {snapshot.learningPlan.goals || "No goals shared yet."}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-500">
              Your mentor has not created a plan yet.
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">My Courses</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Continue your enrolled recorded courses.
              </p>
            </div>
            <Link href="/courses" className="text-sm font-semibold text-neutral-900">
              Browse Courses
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {snapshot.enrollments.length > 0 ? (
              snapshot.enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <p className="font-semibold text-neutral-900">{enrollment.course.title}</p>
                  <div className="mt-3 h-2 rounded-full bg-neutral-200">
                    <div
                      className="h-2 rounded-full bg-neutral-900"
                      style={{ width: `${Math.max(0, Math.min(100, enrollment.progress))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    {enrollment.progress}% complete
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-500">
                No enrolled courses yet.
              </div>
            )}
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
      <p className="mt-3 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
