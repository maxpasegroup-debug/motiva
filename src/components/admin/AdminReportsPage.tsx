"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type LaunchReport = {
  success: boolean;
  generatedAt: string;
  metrics: {
    launchScore: number;
    enquiries: {
      total: number;
      new: number;
      contacted: number;
      converted: number;
      conversionRate: number;
      recent30DayTotal: number;
      recent30DayConversionRate: number;
    };
    leads: {
      total: number;
      new: number;
      contacted: number;
      admission: number;
      paymentPending: number;
      paymentConfirmed: number;
      closedLost: number;
      atRisk: number;
    };
    delivery: {
      students: number;
      parents: number;
      activeLearningPlans: number;
      recentlyUpdatedPlans: number;
      learningPlanCoverage: number;
      attendanceMarked7Days: number;
      attendancePercentage7Days: number;
    };
    money: {
      paidAmount: number;
      paidPayments: number;
      pendingPayments: number;
    };
  };
  recentEnquiries: {
    id: string;
    name: string;
    mobile: string;
    status: string;
    programInterest: string;
    createdAt: string;
  }[];
  atRiskLeads: {
    id: string;
    name: string;
    phone: string;
    status: string;
    flowType: string;
    createdAt: string;
  }[];
};

function formatMoney(value: number) {
  return `Rs ${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function scoreTone(score: number) {
  if (score >= 80) return "bg-emerald-100 text-emerald-800";
  if (score >= 55) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

function statusTone(value: string) {
  if (value === "converted" || value === "payment_confirmed") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (value === "new" || value === "payment_pending") {
    return "bg-amber-100 text-amber-800";
  }
  if (value === "closed_lost" || value === "closed") {
    return "bg-rose-100 text-rose-800";
  }
  return "bg-blue-100 text-blue-800";
}

export function AdminReportsPage() {
  const [report, setReport] = useState<LaunchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/reports/launch", {
      cache: "no-store",
    });
    const json = (await res.json().catch(() => null)) as
      | (LaunchReport & { error?: string })
      | null;
    if (!res.ok || !json?.success) {
      setError(json?.error ?? "Could not load launch report");
      setReport(null);
      setLoading(false);
      return;
    }
    setReport(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-sm text-neutral-500 shadow-sm">
        Loading launch report...
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700">
        {error ?? "Could not load launch report"}
      </div>
    );
  }

  const { metrics } = report;
  const dailyActions = [
    metrics.enquiries.new > 0
      ? `Call or WhatsApp ${metrics.enquiries.new} new parent enquiries today.`
      : "No new enquiry is waiting. Push one local campaign or WhatsApp status today.",
    metrics.leads.atRisk > 0
      ? `Recover ${metrics.leads.atRisk} old leads before they go cold.`
      : "No old lead is stuck beyond 7 days.",
    metrics.delivery.learningPlanCoverage < 80
      ? "Create learning plans for admitted students without an active plan."
      : "Learning plan coverage is healthy. Keep mentor updates moving.",
    metrics.delivery.attendancePercentage7Days < 75
      ? "Review attendance follow-up with teachers and parents this week."
      : "Attendance health is acceptable this week.",
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Launch Control
            </p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-900">
              Motiva Market Readiness
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              Owner view for parent demand, lead movement, payment signal, and
              delivery trust.
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              Updated {formatDate(report.generatedAt)}
            </p>
          </div>
          <div
            className={`rounded-2xl px-5 py-4 text-center ${scoreTone(metrics.launchScore)}`}
          >
            <p className="text-xs font-bold uppercase tracking-wide">
              Launch Score
            </p>
            <p className="mt-1 text-4xl font-black tabular-nums">
              {metrics.launchScore}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="New Enquiries"
          value={metrics.enquiries.new}
          detail={`${metrics.enquiries.converted} converted total`}
        />
        <MetricCard
          label="Lead Admissions"
          value={metrics.leads.admission}
          detail={`${metrics.leads.paymentPending} payment pending`}
        />
        <MetricCard
          label="Collected"
          value={formatMoney(metrics.money.paidAmount)}
          detail={`${metrics.money.pendingPayments} payments pending`}
        />
        <MetricCard
          label="Plan Coverage"
          value={`${metrics.delivery.learningPlanCoverage}%`}
          detail={`${metrics.delivery.activeLearningPlans}/${metrics.delivery.students} students`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">
            Daily Owner Actions
          </h2>
          <ol className="mt-5 space-y-3">
            {dailyActions.map((action, index) => (
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
            Funnel Health
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <HealthRow
              label="Enquiry conversion"
              value={`${metrics.enquiries.conversionRate}%`}
              detail={`${metrics.enquiries.converted}/${metrics.enquiries.total}`}
            />
            <HealthRow
              label="30 day conversion"
              value={`${metrics.enquiries.recent30DayConversionRate}%`}
              detail={`${metrics.enquiries.recent30DayTotal} enquiries`}
            />
            <HealthRow
              label="7 day attendance"
              value={`${metrics.delivery.attendancePercentage7Days}%`}
              detail={`${metrics.delivery.attendanceMarked7Days} records`}
            />
            <HealthRow
              label="Updated plans"
              value={metrics.delivery.recentlyUpdatedPlans}
              detail="last 7 days"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ReportTable
          title="Newest Parent Enquiries"
          empty="No enquiries yet."
          rows={report.recentEnquiries.map((row) => ({
            id: row.id,
            primary: row.name,
            secondary: `${row.mobile} - ${row.programInterest.replace(/_/g, " ")}`,
            status: row.status,
            date: row.createdAt,
            href: "/admin/enquiries",
          }))}
        />
        <ReportTable
          title="Leads To Recover"
          empty="No old active leads."
          rows={report.atRiskLeads.map((row) => ({
            id: row.id,
            primary: row.name,
            secondary: `${row.phone} - ${row.flowType}`,
            status: row.status,
            date: row.createdAt,
            href: `/admin/leads/${row.id}`,
          }))}
        />
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-neutral-900">{value}</p>
      <p className="mt-2 text-xs font-semibold text-neutral-500">{detail}</p>
    </div>
  );
}

function HealthRow({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-neutral-900">{value}</p>
      <p className="mt-1 text-xs font-semibold text-neutral-500">{detail}</p>
    </div>
  );
}

function ReportTable({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: {
    id: string;
    primary: string;
    secondary: string;
    status: string;
    date: string;
    href: string;
  }[];
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
      <div className="mt-5 space-y-3">
        {rows.length > 0 ? (
          rows.map((row) => (
            <Link
              key={row.id}
              href={row.href}
              className="block rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-neutral-900">{row.primary}</p>
                  <p className="mt-1 text-sm text-neutral-600">{row.secondary}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {formatDate(row.date)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusTone(row.status)}`}
                >
                  {row.status.replace(/_/g, " ")}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
            {empty}
          </p>
        )}
      </div>
    </div>
  );
}
