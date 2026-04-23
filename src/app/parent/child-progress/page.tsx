import { getMoodEmoji, formatPercentage, formatShortDate } from "@/lib/portal";
import { requireParentSession } from "@/server/parent/auth";
import { getParentChildProgress } from "@/server/parent/data";

export const dynamic = "force-dynamic";

export default async function ParentChildProgressPage() {
  const session = requireParentSession();
  const snapshot = await getParentChildProgress(session.userId);

  if (!snapshot) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        Parent profile not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Child Progress</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Attendance trend and recent wellbeing check-ins.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card label="Weekly Attendance" value={formatPercentage(snapshot.weekly.percentage)} />
        <Card label="Weekly Present" value={String(snapshot.weekly.present)} />
        <Card label="Weekly Absent" value={String(snapshot.weekly.absent)} />
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">Mood Trend</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {snapshot.mood.length > 0 ? (
            snapshot.mood.map((entry) => (
              <div
                key={entry.id}
                className="flex min-w-[72px] flex-col items-center rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
              >
                <span className="text-2xl">{getMoodEmoji(entry.rating)}</span>
                <span className="mt-2 text-xs text-neutral-500">
                  {formatShortDate(entry.date)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-500">No mood trend available yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-neutral-900">Attendance History</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Day</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.attendance.map((record) => (
                <tr key={record.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 text-neutral-900">Day {record.dayNumber}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatShortDate(record.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        record.status === "present"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
