"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type PaymentRow = {
  admission: {
    id: string;
    leadId: string;
    studentName: string;
    parentName: string;
    phone: string;
    type: string;
    status: string;
    totalFee: number;
    currency: string;
    notes: string | null;
    createdAt: string;
  };
  lead: {
    id: string;
    status: string;
    subjects: string | null;
  };
  paid: number;
  pending: number;
  payments: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    notes: string | null;
    recordedBy: string | null;
    createdAt: string;
  }[];
};

function formatMoney(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN");
}

export function AdminPaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/payments");
    const json = (await res.json().catch(() => ({}))) as {
      rows?: PaymentRow[];
      error?: string;
    };
    if (!res.ok) {
      setError(json.error ?? "Could not load fees");
      setRows([]);
    } else {
      setRows(json.rows ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function recordPayment(event: FormEvent) {
    event.preventDefault();
    if (!activeId) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admissionId: activeId,
        amount: Number(amount),
        notes: remarks.trim(),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      onboarding?: { ok: boolean; error?: string; warnings?: string[] } | null;
    };
    setBusy(false);
    if (!res.ok) {
      setError(json.error ?? "Could not record payment");
      return;
    }
    if (json.onboarding && !json.onboarding.ok) {
      setError(
        `Payment saved, but onboarding needs admin action: ${
          json.onboarding.error ?? "Could not complete onboarding"
        }`,
      );
    } else if (json.onboarding?.warnings?.length) {
      setError(
        `Payment saved. Onboarding needs admin action: ${json.onboarding.warnings.join(
          " ",
        )}`,
      );
    }
    setActiveId(null);
    setAmount("");
    setRemarks("");
    await refresh();
  }

  const activeRow = rows.find((row) => row.admission.id === activeId) ?? null;

  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 text-neutral-600">
        Fees are shown only for admitted enquiries. Record every part payment
        with remarks; pending balance is calculated from the admission fee.
      </p>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          Loading fees...
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 bg-white py-12 text-center text-neutral-500">
          No admitted students with fees yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const paidInFull =
              row.admission.totalFee > 0 && row.paid >= row.admission.totalFee;
            return (
              <li key={row.admission.id}>
                <Card className="p-5">
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground">
                          {row.admission.studentName}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            paidInFull
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {paidInFull ? "Paid" : "Partial / Pending"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-neutral-600">
                        Parent: {row.admission.parentName} | Phone:{" "}
                        {row.admission.phone}
                      </p>
                      <p className="mt-1 text-sm text-neutral-600">
                        {row.lead.subjects || row.admission.type}
                      </p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg bg-neutral-50 p-3">
                          <p className="text-xs font-bold uppercase text-neutral-500">
                            Total
                          </p>
                          <p className="mt-1 font-bold">
                            {formatMoney(row.admission.totalFee, row.admission.currency)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-emerald-50 p-3">
                          <p className="text-xs font-bold uppercase text-emerald-700">
                            Paid
                          </p>
                          <p className="mt-1 font-bold text-emerald-800">
                            {formatMoney(row.paid, row.admission.currency)}
                          </p>
                        </div>
                        <div className="rounded-lg bg-orange-50 p-3">
                          <p className="text-xs font-bold uppercase text-orange-700">
                            Pending
                          </p>
                          <p className="mt-1 font-bold text-orange-800">
                            {formatMoney(row.pending, row.admission.currency)}
                          </p>
                        </div>
                      </div>

                      {row.payments.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-bold uppercase text-neutral-500">
                            Payment history
                          </p>
                          {row.payments.map((payment) => (
                            <div
                              key={payment.id}
                              className="rounded-lg border border-neutral-200 bg-white p-3 text-sm"
                            >
                              <div className="flex flex-wrap justify-between gap-2">
                                <span className="font-bold">
                                  {formatMoney(payment.amount, payment.currency)}
                                </span>
                                <span className="text-neutral-500">
                                  {formatDate(payment.createdAt)}
                                </span>
                              </div>
                              {payment.notes ? (
                                <p className="mt-1 text-neutral-600">
                                  Remarks: {payment.notes}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setActiveId(row.admission.id);
                          setAmount(row.pending > 0 ? String(row.pending) : "");
                          setRemarks("");
                        }}
                        className="min-h-11"
                      >
                        Add Payment
                      </Button>
                      <Link
                        href={`/admin/leads/${row.admission.leadId}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-primary bg-white px-6 text-sm font-semibold text-primary"
                      >
                        Manage Lead
                      </Link>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {activeRow ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground">
              Add fee payment
            </h3>
            <p className="mt-1 text-sm text-neutral-600">
              {activeRow.admission.studentName} | Pending{" "}
              {formatMoney(activeRow.pending, activeRow.admission.currency)}
            </p>
            <form onSubmit={recordPayment} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-neutral-700">
                Amount paid
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
                />
              </label>
              <label className="block text-sm font-medium text-neutral-700">
                Remarks
                <textarea
                  required
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-lg border border-neutral-300 px-3 py-3 text-sm"
                  placeholder="Receipt number, mode, collector, or follow-up note"
                />
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={busy} className="min-h-11 flex-1">
                  {busy ? "Saving..." : "Record Payment"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveId(null)}
                  className="min-h-11 flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
