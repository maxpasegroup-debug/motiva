"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  BookOpenCheck,
  CalendarClock,
  ChartNoAxesCombined,
  ClipboardCheck,
  GraduationCap,
  Handshake,
  Presentation,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { ActivityTimeline } from "@/components/admin/ActivityTimeline";
import { QuickActions } from "@/components/admin/QuickActions";
import { StatsCard } from "@/components/admin/StatsCard";
import { countPendingAdmissions } from "@/lib/admissions-store";
import { listPaymentEntries, totalPaidAmount } from "@/lib/payments-ledger-store";
import { getAuthToken } from "@/lib/session";
import { listStudents } from "@/lib/students-store";
import { listTeachers } from "@/lib/teachers-store";

type LeadRow = {
  id: string;
  status: string;
  created_at?: string;
  createdAt?: string;
};

type DashboardStats = {
  leads: number;
  admissionsThisMonth: number;
  revenueMtd: number;
  activeStudents: number;
  activeBatches: number;
  teachers: number;
  mentors: number;
  courseSales: number;
  attendanceRate: number;
  conversionRate: number;
  pendingAdmissions: number;
  pendingPayments: number;
};

type BatchSummary = {
  id: string;
  name: string;
  course_title?: string;
  current_day?: number;
  present_today?: number;
};

const emptyStats: DashboardStats = {
  leads: 0,
  admissionsThisMonth: 0,
  revenueMtd: 0,
  activeStudents: 0,
  activeBatches: 0,
  teachers: 0,
  mentors: 0,
  courseSales: 0,
  attendanceRate: 0,
  conversionRate: 0,
  pendingAdmissions: 0,
  pendingPayments: 0,
};

function money(value: number) {
  return `Rs ${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function isThisMonth(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function percent(value: number) {
  return `${Math.round(value)}%`;
}

async function fetchJson<T>(url: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const token = getAuthToken();
    const payments = listPaymentEntries();
    const students = listStudents();
    const teachers = listTeachers();
    const paidPayments = payments.filter((payment) => payment.status === "paid");
    const monthPayments = paidPayments.filter((payment) => isThisMonth(payment.createdAt));

    let serverBatches: BatchSummary[] = [];
    let serverLeads: LeadRow[] = [];

    if (token) {
      const [batchBody, leadBody] = await Promise.all([
        fetchJson<{ batches?: BatchSummary[] }>("/api/admin/batches", token),
        fetchJson<{ leads?: LeadRow[] }>("/api/leads", token),
      ]);
      serverBatches = batchBody?.batches ?? [];
      serverLeads = leadBody?.leads ?? [];
    }

    const wonLeads = serverLeads.filter((lead) =>
      ["closed_won", "payment_confirmed", "mentor_assigned", "admission"].includes(lead.status),
    ).length;
    const presentToday = serverBatches.reduce((sum, batch) => sum + (batch.present_today ?? 0), 0);
    const attendanceBase = Math.max(students.length, presentToday);

    setLeads(serverLeads);
    setBatches(serverBatches);
    setStats({
      leads: serverLeads.length,
      admissionsThisMonth: Math.max(countPendingAdmissions(), wonLeads),
      revenueMtd: monthPayments.reduce((sum, payment) => sum + payment.amount, 0) || totalPaidAmount(),
      activeStudents: students.length,
      activeBatches: serverBatches.length,
      teachers: teachers.length,
      mentors: 0,
      courseSales: paidPayments.length,
      attendanceRate: attendanceBase ? (presentToday / attendanceBase) * 100 : 0,
      conversionRate: serverLeads.length ? (wonLeads / serverLeads.length) * 100 : 0,
      pendingAdmissions: countPendingAdmissions(),
      pendingPayments: payments.filter((payment) => payment.status === "pending").length,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const onAny = () => void refresh();
    window.addEventListener("motiva-users-updated", onAny);
    window.addEventListener("motiva-classes-updated", onAny);
    window.addEventListener("motiva-admissions-updated", onAny);
    window.addEventListener("motiva-payments-ledger-updated", onAny);
    return () => {
      window.removeEventListener("motiva-users-updated", onAny);
      window.removeEventListener("motiva-classes-updated", onAny);
      window.removeEventListener("motiva-admissions-updated", onAny);
      window.removeEventListener("motiva-payments-ledger-updated", onAny);
    };
  }, [refresh]);

  const leadFunnel = useMemo(() => {
    const total = Math.max(leads.length, 1);
    const buckets = [
      { label: "New", count: leads.filter((lead) => lead.status === "new").length },
      {
        label: "Contacted",
        count: leads.filter((lead) => ["contacted", "demo_scheduled"].includes(lead.status)).length,
      },
      {
        label: "Demo",
        count: leads.filter((lead) => ["demo_done", "counseling"].includes(lead.status)).length,
      },
      {
        label: "Admission",
        count: leads.filter((lead) => ["admission", "payment_pending"].includes(lead.status)).length,
      },
      {
        label: "Won",
        count: leads.filter((lead) =>
          ["closed_won", "payment_confirmed", "mentor_assigned"].includes(lead.status),
        ).length,
      },
    ];
    return buckets.map((bucket) => ({
      ...bucket,
      width: Math.max(8, Math.round((bucket.count / total) * 100)),
    }));
  }, [leads]);

  const activities = [
    {
      title: "Admissions review",
      description: `${stats.pendingAdmissions} admission requests need a decision.`,
      time: "Now",
      tone: stats.pendingAdmissions > 0 ? "orange" : "green",
    },
    {
      title: "Fee collection",
      description: `${stats.pendingPayments} payments are still pending in the ledger.`,
      time: "Today",
      tone: stats.pendingPayments > 0 ? "red" : "green",
    },
    {
      title: "Batch operations",
      description: `${stats.activeBatches} active batches are available for scheduling and attendance.`,
      time: "Live",
      tone: "blue",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-blue-700">Academy Command Center</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-neutral-950">
              Run admissions, classes, collections, and support from one place.
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Built for day-to-day Motiva management: clear numbers, visible pending work,
              and fast actions without technical complexity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard label="Total Leads" value={String(stats.leads)} helper="CRM pipeline" icon={Handshake} tone="blue" />
        <StatsCard label="Admissions This Month" value={String(stats.admissionsThisMonth)} helper="Approved or pending" icon={GraduationCap} tone="green" />
        <StatsCard label="Revenue MTD" value={money(stats.revenueMtd)} helper="Collected fees" icon={BadgeIndianRupee} tone="green" />
        <StatsCard label="Active Students" value={String(stats.activeStudents)} helper="Student accounts" icon={UsersRound} tone="blue" />
        <StatsCard label="Active Batches" value={String(stats.activeBatches)} helper="Running groups" icon={CalendarClock} tone="orange" />
        <StatsCard label="Teachers" value={String(stats.teachers)} helper="Teaching team" icon={Presentation} tone="neutral" />
        <StatsCard label="Mentors" value={String(stats.mentors)} helper="Mentor workspace" icon={UserRoundCheck} tone="neutral" />
        <StatsCard label="Course Sales" value={String(stats.courseSales)} helper="Paid course entries" icon={BookOpenCheck} tone="green" />
        <StatsCard label="Attendance Rate" value={percent(stats.attendanceRate)} helper="Today across batches" icon={ClipboardCheck} tone={stats.attendanceRate < 60 ? "red" : "blue"} />
        <StatsCard label="Conversion Rate" value={percent(stats.conversionRate)} helper="Lead to admission" icon={TrendingUp} tone="orange" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <QuickActions />

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-neutral-950">Lead Funnel</h2>
              <p className="mt-1 text-sm text-neutral-500">Where admissions work is currently sitting.</p>
              <div className="mt-5 space-y-3">
                {leadFunnel.map((bucket) => (
                  <div key={bucket.label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-neutral-700">{bucket.label}</span>
                      <span className="text-neutral-500">{bucket.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${bucket.width}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-neutral-950">Revenue Trend</h2>
              <p className="mt-1 text-sm text-neutral-500">Simple collection pulse for management.</p>
              <div className="mt-6 flex h-36 items-end gap-3">
                {[42, 56, 38, 74, 68, 88, Math.max(28, Math.min(96, stats.revenueMtd / 1000))].map(
                  (height, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-md bg-neutral-900"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-[11px] text-neutral-400">D{index + 1}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </section>

          <section id="tasks" className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-950">Upcoming Classes</h2>
            <p className="mt-1 text-sm text-neutral-500">Batches that need daily supervision.</p>
            <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
              {batches.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-neutral-500">
                  No active batch data available yet.
                </div>
              ) : (
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Current Day</th>
                      <th className="px-4 py-3">Present Today</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {batches.slice(0, 5).map((batch) => (
                      <tr key={batch.id}>
                        <td className="px-4 py-3 font-medium text-neutral-950">{batch.name}</td>
                        <td className="px-4 py-3 text-neutral-600">{batch.course_title ?? "-"}</td>
                        <td className="px-4 py-3 text-neutral-600">{batch.current_day ?? "-"}</td>
                        <td className="px-4 py-3 text-neutral-600">{batch.present_today ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section id="alerts" className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <ChartNoAxesCombined className="h-5 w-5 text-blue-700" aria-hidden />
              <h2 className="text-base font-semibold text-neutral-950">Management Alerts</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                <p className="text-sm font-medium text-orange-900">Pending admissions</p>
                <p className="mt-1 text-sm text-orange-800">
                  {stats.pendingAdmissions} students need approval or follow-up.
                </p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-900">Pending fee collection</p>
                <p className="mt-1 text-sm text-red-800">
                  {stats.pendingPayments} payment entries are not marked paid.
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-sm font-medium text-blue-900">Operations health</p>
                <p className="mt-1 text-sm text-blue-800">
                  {stats.activeBatches} batches and {stats.teachers} teachers are visible.
                </p>
              </div>
            </div>
          </section>

          <ActivityTimeline activities={[...activities]} />
        </div>
      </div>
    </div>
  );
}
