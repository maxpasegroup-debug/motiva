import { formatPercentage, formatShortDate } from "@/lib/portal";
import { requireStudentSession } from "@/server/student/auth";
import { getStudentAttendanceHistory } from "@/server/student/data";

export const dynamic = "force-dynamic";

export default async function StudentAttendancePage() {
  const session = requireStudentSession();
  const records = await getStudentAttendanceHistory(session.userId);

  const present = records.filter((record) => record.status === "present").length;
  const absent = records.filter((record) => record.status === "absent").length;
  const percentage =
    present + absent > 0 ? (present / (present + absent)) * 100 : 0;

  const byMonth = new Map<string, typeof records>();
  for (const record of records) {
    const key = record.createdAt.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    byMonth.set(key, [...(byMonth.get(key) ?? []), record]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Attendance History</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Full month-by-month attendance overview.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Present" value={String(present)} />
        <StatCard label="Total Absent" value={String(absent)} />
        <StatCard label="Overall Percentage" value={formatPercentage(percentage)} />
      </section>

      <section className="space-y-5">
        {Array.from(byMonth.entries()).map(([month, monthRecords]) => (
          <div key={month} className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-900">{month}</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Day</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRecords.map((record) => (
                    <tr key={record.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3 text-neutral-900">Day {record.dayNumber}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {formatShortDate(record.createdAt)}
                      </td>
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
          </div>
        ))}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
