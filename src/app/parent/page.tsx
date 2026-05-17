import Link from "next/link";
import {
  Bell,
  BookOpenCheck,
  FileText,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { parseLearningPlanSubjects } from "@/lib/mentor";
import {
  formatPercentage,
  formatShortDate,
  formatShortDateTime,
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
    <div className="space-y-5">
      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-neutral-500">Parent Portal</p>
            <h1 className="mt-2 text-2xl font-bold text-neutral-900 sm:text-3xl">
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

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              ? `${snapshot.todayMood.rating}/5`
              : "No check-in today"
          }
        />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-neutral-950">Quick Actions</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <ActionLink href="/parent/child-progress" label="Progress" helper="Attendance and class progress" icon={FileText} />
          <ActionLink href="/parent/learning-report" label="Learning Report" helper="Plan and teacher notes" icon={BookOpenCheck} />
          <ActionLink href="/parent/notifications" label="Notifications" helper="Messages from Motiva" icon={Bell} />
          <ActionLink href="/contact" label="Contact" helper="Ask for support" icon={MessageCircle} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Recent Attendance</h2>
              <p className="mt-1 text-sm text-neutral-500">
                The latest 10 attendance records for your child.
              </p>
            </div>
            <Link href="/parent/child-progress" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-900">
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

        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Upcoming Classes</h2>
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
                    {schedule.scheduledTime ?? "Time not set"} -{" "}
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

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Notifications</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Unread first, with quick mark-as-read actions.
              </p>
            </div>
            <Link href="/parent/notifications" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-900">
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

        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              Child&apos;s Learning Plan
            </h2>
            <Link
              href="/parent/learning-report"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-900"
            >
              Open report
            </Link>
          </div>
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
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-neutral-900 sm:text-2xl">{value}</p>
    </div>
  );
}

function ActionLink({
  href,
  label,
  helper,
  icon: Icon,
}: {
  href: string;
  label: string;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-20 items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 hover:bg-blue-50"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-neutral-200">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-neutral-950">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-neutral-500">{helper}</span>
      </span>
    </Link>
  );
}
