"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type PipelineAdmission = {
  id: string;
  lead_id: string;
  student_name: string;
  parent_name: string;
  phone: string;
  type: "tuition" | "foundation";
  status: "pending" | "approved";
  fee_amount_cents: number | null;
  fee_currency: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CreatedCreds = {
  student: { email: string; password: string | null };
  parent: { email: string; password: string | null };
  mentor?: { id: string; name: string } | null;
  teacher?: { id: string; name: string } | null;
  batch?: { id: string; name: string } | null;
  warnings?: string[];
};

function formatMoney(cents: number | null, currency = "INR") {
  if (!cents || cents <= 0) return "Fee not fixed";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN");
}

export function AdminAdmissionsPage() {
  const [rows, setRows] = useState<PipelineAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCreds | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/pipeline-admissions");
    const json = (await res.json().catch(() => ({}))) as {
      admissions?: PipelineAdmission[];
      error?: string;
    };
    if (!res.ok) {
      setError(json.error ?? "Could not load admissions");
      setRows([]);
    } else {
      setRows(json.admissions ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function approve(row: PipelineAdmission) {
    setBusyId(row.id);
    setError(null);
    const res = await fetch(`/api/admin/pipeline-admissions/${row.id}/approve`, {
      method: "POST",
    });
    const json = (await res.json().catch(() => ({}))) as CreatedCreds & {
      error?: string;
    };
    setBusyId(null);
    if (!res.ok || !json.student || !json.parent) {
      setError(json.error ?? "Could not approve admission");
      return;
    }
    setCreated({
      student: json.student,
      parent: json.parent,
      mentor: json.mentor,
      teacher: json.teacher,
      batch: json.batch,
      warnings: json.warnings ?? [],
    });
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm leading-6 text-neutral-600">
          Only enquiries promoted to admission from the lead tracker appear here.
          Approving an admission creates the student and parent login.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
          Loading admissions...
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 bg-white py-12 text-center text-neutral-500">
          No promoted admissions yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Card className="p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold text-foreground">
                        {row.student_name}
                      </p>
                      <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold capitalize text-neutral-700">
                        {row.status}
                      </span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold capitalize text-blue-700">
                        {row.type}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-neutral-600">
                      Parent: {row.parent_name} | Phone: {row.phone}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-800">
                      {formatMoney(row.fee_amount_cents, row.fee_currency ?? "INR")}
                    </p>
                    {row.notes ? (
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-neutral-600">
                        Remarks: {row.notes}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-neutral-400">
                      Created: {formatDate(row.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button
                      href={`/admin/leads/${row.lead_id}`}
                      variant="outline"
                      className="min-h-11"
                    >
                      Manage Lead
                    </Button>
                    {row.status === "pending" ? (
                      <Button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void approve(row)}
                        className="min-h-11"
                      >
                        {busyId === row.id ? "Approving..." : "Approve Admission"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {created ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-foreground">Login Created</h3>
            <div className="mt-4 space-y-4 rounded-lg bg-neutral-50 p-4 text-sm">
              <div>
                <p className="font-bold">Student</p>
                <p>Email/mobile: {created.student.email}</p>
                <p>
                  Password/PIN:{" "}
                  {created.student.password ?? "Already existed - unchanged"}
                </p>
              </div>
              <div>
                <p className="font-bold">Parent</p>
                <p>Email/mobile: {created.parent.email}</p>
                <p>
                  Password/PIN:{" "}
                  {created.parent.password ?? "Already existed - unchanged"}
                </p>
              </div>
              <div>
                <p className="font-bold">Assignment</p>
                <p>Mentor: {created.mentor?.name ?? "Not assigned"}</p>
                <p>Teacher: {created.teacher?.name ?? "Not assigned"}</p>
                <p>Batch: {created.batch?.name ?? "Not assigned"}</p>
              </div>
              {created.warnings?.length ? (
                <div className="rounded-lg bg-yellow-50 p-3 text-yellow-800">
                  <p className="font-bold">Needs admin action</p>
                  {created.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
            </div>
            <Button
              type="button"
              onClick={() => setCreated(null)}
              className="mt-5 min-h-11 w-full"
            >
              OK
            </Button>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
