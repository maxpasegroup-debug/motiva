import Link from "next/link";
import { formatDate } from "@/lib/mentor";
import { requireMentorSession } from "@/server/mentor/auth";
import { getMentorScheduleForWeek } from "@/server/mentor/data";

export const dynamic = "force-dynamic";

export default async function MentorSchedulePage({
  searchParams,
}: {
  searchParams?: { week?: string };
}) {
  const session = requireMentorSession();
  const weekDate =
    typeof searchParams?.week === "string" && !Number.isNaN(new Date(searchParams.week).getTime())
      ? new Date(searchParams.week)
      : undefined;
  const schedule = await getMentorScheduleForWeek(session.userId, weekDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Class Schedule</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Week view of scheduled classes for your assigned students.
          </p>
        </div>
        <Link
          href="/mentor/schedule/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Add Class
        </Link>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-neutral-500">
          Week of {formatDate(schedule.weekStart)} to {formatDate(schedule.weekEnd)}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-7">
        {schedule.days.map((day) => (
          <div
            key={day.date.toISOString()}
            className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <h2 className="text-base font-semibold text-neutral-900">
              {day.date.toLocaleDateString("en-IN", {
                weekday: "short",
              })}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">{formatDate(day.date)}</p>

            <div className="mt-4 space-y-3">
              {day.schedules.length > 0 ? (
                day.schedules.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
                  >
                    <p className="text-sm font-semibold text-neutral-900">
                      {item.scheduledTime ?? "Time not set"}
                    </p>
                    <p className="mt-2 text-sm text-neutral-700">
                      {item.student?.studentName ?? "Student not assigned"}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {item.teacherName} • {item.subject ?? item.topic ?? "Subject not set"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
                  No classes
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
