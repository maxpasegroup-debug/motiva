"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Handshake,
  PhoneCall,
  UserPlus,
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
  name?: string;
  phone?: string;
  status: string;
  assigned_to?: string | null;
  assignedTo?: string | null;
  notes?: string | null;
  updated_at?: string;
  updatedAt?: string;
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
  courseSales: number;
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
  courseSales: 0,
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

function formatDateTime(value?: string) {
  if (!value) return "Not updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not updated";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getLeadStatusLabel(status: string) {
  switch (status) {
    case "demo":
    case "demo_scheduled":
    case "demo_done":
      return "Demo";
    case "admission":
    case "payment_pending":
    case "payment_confirmed":
    case "account_created":
    case "mentor_assigned":
    case "closed_won":
      return "Admission";
    case "closed":
    case "closed_lost":
      return "Lost";
    case "contacted":
      return "Contacted";
    default:
      return "New";
  }
}

function getLeadOwner(lead: LeadRow) {
  const noteOwner = (() => {
    if (!lead.notes?.trim()) return null;
    try {
      const entries = JSON.parse(lead.notes) as unknown;
      if (!Array.isArray(entries)) return null;
      const latestOwner = [...entries]
        .reverse()
        .map((entry) => {
          if (!entry || typeof entry !== "object") return "";
          const addedBy = (entry as { addedBy?: unknown }).addedBy;
          return typeof addedBy === "string" ? addedBy.trim() : "";
        })
        .find(Boolean);
      return latestOwner || null;
    } catch {
      const match = lead.notes.match(/(?:Converted by|Entered by)\s+([^.(]+)(?:\s*\(|\.|$)/i);
      return match?.[1]?.trim() || null;
    }
  })();

  return noteOwner || lead.assignedTo?.trim() || lead.assigned_to?.trim() || "Unassigned";
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

    setLeads(serverLeads);
    setBatches(serverBatches);
    setStats({
      leads: serverLeads.length,
      admissionsThisMonth: Math.max(countPendingAdmissions(), wonLeads),
      revenueMtd: monthPayments.reduce((sum, payment) => sum + payment.amount, 0) || totalPaidAmount(),
      activeStudents: students.length,
      activeBatches: serverBatches.length,
      teachers: teachers.length,
      courseSales: paidPayments.length,
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

  const newLeads = useMemo(
    () => leads.filter((lead) => ["new", "contacted", "demo_scheduled"].includes(lead.status)).length,
    [leads],
  );
  const activeLeadTrackers = useMemo(
    () =>
      leads
        .filter((lead) => !["closed", "closed_lost"].includes(lead.status))
        .sort((a, b) => {
          const aTime = new Date(a.updatedAt ?? a.updated_at ?? a.createdAt ?? a.created_at ?? 0).getTime();
          const bTime = new Date(b.updatedAt ?? b.updated_at ?? b.createdAt ?? b.created_at ?? 0).getTime();
          return bTime - aTime;
        })
        .slice(0, 6),
    [leads],
  );

  const attentionItems = [
    {
      title: "Admission approval",
      count: stats.pendingAdmissions,
      helper:
        stats.pendingAdmissions > 0
          ? "Students are waiting for approval or follow-up."
          : "No admission approvals are pending.",
      href: "/admin/admissions",
      icon: GraduationCap,
      tone: stats.pendingAdmissions > 0 ? "orange" : "green",
    },
    {
      title: "Fee collection",
      count: stats.pendingPayments,
      helper:
        stats.pendingPayments > 0
          ? "Payments are still marked as pending."
          : "No pending fee entries in the ledger.",
      href: "/admin/payments",
      icon: BadgeIndianRupee,
      tone: stats.pendingPayments > 0 ? "red" : "green",
    },
    {
      title: "New enquiries",
      count: newLeads,
      helper:
        newLeads > 0
          ? "Families need a call, demo, or admission update."
          : "No fresh enquiries need immediate action.",
      href: "/admin/leads",
      icon: PhoneCall,
      tone: newLeads > 0 ? "blue" : "green",
    },
  ] as const;

  const activities = [
    {
      title: "Admissions",
      description: `${stats.pendingAdmissions} admission requests need a decision.`,
      time: "Now",
      tone: stats.pendingAdmissions > 0 ? "orange" : "green",
    },
    {
      title: "Fees",
      description: `${stats.pendingPayments} payments are still pending.`,
      time: "Today",
      tone: stats.pendingPayments > 0 ? "red" : "green",
    },
    {
      title: "Classes",
      description: `${stats.activeBatches} batches are visible for daily supervision.`,
      time: "Live",
      tone: "blue",
    },
  ] as const;

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-blue-700">Today</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-neutral-950">
              What needs attention today?
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              A simple daily view for enquiries, admissions, fees, classes, and students.
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Enquiries"
          value={String(newLeads)}
          helper="Call or follow up"
          icon={Handshake}
          tone={newLeads > 0 ? "blue" : "green"}
        />
        <StatsCard
          label="Admissions"
          value={String(stats.pendingAdmissions)}
          helper="Approve or update"
          icon={GraduationCap}
          tone={stats.pendingAdmissions > 0 ? "orange" : "green"}
        />
        <StatsCard
          label="Fees"
          value={String(stats.pendingPayments)}
          helper="Collection follow-up"
          icon={BadgeIndianRupee}
          tone={stats.pendingPayments > 0 ? "red" : "green"}
        />
        <StatsCard
          label="Classes"
          value={String(stats.activeBatches)}
          helper="Running batches"
          icon={CalendarClock}
          tone="blue"
        />
      </section>

      <QuickActions />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-5">
          <section
            id="attention"
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-950">Do This First</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  The most important academy work is kept here.
                </p>
              </div>
            </div>
            <div className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200">
              {attentionItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-start gap-3 bg-white p-4 transition-colors hover:bg-neutral-50"
                >
                  <span
                    className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      item.tone === "red"
                        ? "bg-red-50 text-red-700"
                        : item.tone === "orange"
                          ? "bg-orange-50 text-orange-700"
                          : item.tone === "blue"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-neutral-950">{item.title}</span>
                      <span className="inline-flex min-w-8 justify-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700">
                        {item.count}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-neutral-500">
                      {item.helper}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section
            id="lead-trackers"
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-950">Lead Tracker</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Latest active leads with the telecaller or owner responsible.
                </p>
              </div>
              <Link
                href="/admin/leads"
                className="mt-2 inline-flex h-9 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:mt-0"
              >
                View All
              </Link>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
              {activeLeadTrackers.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-neutral-500">
                  No active leads are waiting in the tracker.
                </div>
              ) : (
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Lead</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {activeLeadTrackers.map((lead) => (
                      <tr key={lead.id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-neutral-950">{lead.name ?? "Unnamed lead"}</p>
                          <p className="mt-0.5 text-xs text-neutral-500">{lead.phone ?? "No phone"}</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-neutral-700">{getLeadOwner(lead)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                            {getLeadStatusLabel(lead.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {formatDateTime(lead.updatedAt ?? lead.updated_at ?? lead.createdAt ?? lead.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section
            id="classes"
            className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-neutral-950">Classes Today</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Batches that need daily supervision.
                </p>
              </div>
              <Link
                href="/admin/batches"
                className="mt-2 inline-flex h-9 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:mt-0"
              >
                View Batches
              </Link>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
              {batches.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-neutral-500">
                  No active batch data available yet.
                </div>
              ) : (
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Day</th>
                      <th className="px-4 py-3">Present</th>
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

        <div className="space-y-5">
          <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" aria-hidden />
              <h2 className="text-base font-semibold text-neutral-950">Office Summary</h2>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Students</dt>
                <dd className="font-semibold text-neutral-950">{stats.activeStudents}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Teachers</dt>
                <dd className="font-semibold text-neutral-950">{stats.teachers}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Leads</dt>
                <dd className="font-semibold text-neutral-950">{stats.leads}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Admissions This Month</dt>
                <dd className="font-semibold text-neutral-950">{stats.admissionsThisMonth}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Collected Fees</dt>
                <dd className="font-semibold text-neutral-950">{money(stats.revenueMtd)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-neutral-500">Course Sales</dt>
                <dd className="font-semibold text-neutral-950">{stats.courseSales}</dd>
              </div>
            </dl>
          </section>

          <ActivityTimeline activities={[...activities]} />

          <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-950">Common Pages</h2>
            <div className="mt-4 grid gap-2">
              <Link
                href="/admin/students"
                className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <UsersRound className="h-4 w-4 text-neutral-500" aria-hidden />
                Students
              </Link>
              <Link
                href="/admin/admissions/create-account"
                className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <UserPlus className="h-4 w-4 text-neutral-500" aria-hidden />
                Create Account
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
