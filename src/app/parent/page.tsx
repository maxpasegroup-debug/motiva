import Link from "next/link";
import { parseLearningPlanSubjects } from "@/lib/mentor";
import {
  formatPercentage,
  formatShortDate,
  formatShortDateTime,
  getMoodEmoji,
} from "@/lib/portal";
import { ParentNotificationActions } from "@/components/parent/ParentNotificationActions";
import { requireParentSession } from "@/server/parent/auth";
import { getParentPortalSnapshot } from "@/server/parent/data";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const session = requireParentSession();
  const snapshot = await getParentPortalSnapshot(session.userId);

  if (!snapshot) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        Parent profile not found.
      </div>
    );
  }

  const planSubjects = snapshot.latestPlan
    ? parseLearningPlanSubjects(snapshot.latestPlan.subjects)
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-500">Parent Portal</p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-900">
              Welcome, {snapshot.parent.name}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Child: {snapshot.child.studentName}
            </p>
          </div>
          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
            {snapshot.child.programType}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Attendance This Week"
          value={formatPercentage(snapshot.weeklyAttendancePercentage)}
        />
        <MetricCard
          label="Current Day"
          value={
            snapshot.child.batch?.progress?.currentDay
              ? `Day ${snapshot.child.batch.progress.currentDay}`
              : "Not in batch"
          }
        />
        <MetricCard
          label="Learning Plan"
          value={snapshot.latestPlan?.status ?? "none"}
        />
        <MetricCard
          label="Last Mood Check-In"
          value={
            snapshot.todayMood
              ? `${getMoodEmoji(snapshot.todayMood.rating)} ${snapshot.todayMood.rating}/5`
              : "No check-in today"
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Recent Attendance</h2>
              <p className="mt-1 text-sm text-neutral-500">
                The latest 10 attendance records for your child.
              </p>
            </div>
            <Link href="/parent/child-progress" className="text-sm font-semibold text-neutral-900">
              Open progress
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.recentAttendance.length > 0 ? (
              snapshot.recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div>
                    <p className="font-semibold text-neutral-900">Day {record.dayNumber}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {formatShortDate(record.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      record.status === "present"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
                No attendance records yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Upcoming Classes</h2>
          <div className="mt-5 space-y-3">
            {snapshot.upcomingClasses.length > 0 ? (
              snapshot.upcomingClasses.map((schedule) => (
                <div
                  key={schedule.id}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <p className="font-semibold text-neutral-900">
                    {formatShortDate(schedule.scheduledDate)}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {schedule.scheduledTime ?? "Time not set"} •{" "}
                    {schedule.subject ?? schedule.topic ?? "Subject not set"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">{schedule.teacherName}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
                No upcoming classes.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Notifications</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Unread first, with quick mark-as-read actions.
              </p>
            </div>
            <Link href="/parent/notifications" className="text-sm font-semibold text-neutral-900">
              View all
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {snapshot.notifications.length > 0 ? (
              snapshot.notifications
                .sort((a, b) => Number(a.is_read) - Number(b.is_read))
                .slice(0, 8)
                .map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {formatShortDateTime(notification.created_at)}
                        </p>
                      </div>
                      <ParentNotificationActions
                        notificationIds={[notification.id]}
                        isRead={notification.is_read}
                      />
                    </div>
                  </div>
                ))
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
                No new notifications.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Child&apos;s Learning Plan</h2>
          {snapshot.latestPlan ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
                {snapshot.latestPlan.goals || "No goals shared yet."}
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
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
              No learning plan assigned yet.
            </div>
          )}
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
