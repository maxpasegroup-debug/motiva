"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { whatsappHref } from "@/components/marketing/whatsapp";

type Enquiry = {
  id: string;
  name: string;
  mobile: string;
  programInterest: string;
  message: string | null;
  status: string;
  createdAt: string;
};

type ConvertResponse = {
  error?: string;
  enquiry?: Enquiry;
  lead?: { id: string };
  reusedExistingLead?: boolean;
};

const STATUS_CLASS: Record<string, string> = {
  new: "bg-neutral-100 text-neutral-700",
  contacted: "bg-blue-100 text-blue-800",
  converted: "bg-emerald-100 text-emerald-800",
  closed_lost: "bg-rose-100 text-rose-800",
};

function formatProgram(value: string) {
  return value.replace(/_/g, " ");
}

function buildWhatsAppMessage(row: Enquiry) {
  return [
    "Hi, Motiva Edus il ninnanu message.",
    `${row.name} parent enquiry submit cheythirunnu.`,
    "Free learning gap check arrange cheyyan vilikkamo?",
    row.message ? `Details: ${row.message}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function AdminEnquiriesPage() {
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [convertedLeadIds, setConvertedLeadIds] = useState<Record<string, string>>({});

  const counts = useMemo(
    () => ({
      new: rows.filter((row) => row.status === "new").length,
      contacted: rows.filter((row) => row.status === "contacted").length,
      converted: rows.filter((row) => row.status === "converted").length,
    }),
    [rows],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await fetch("/api/admin/enquiries");
      const json = (await res.json().catch(() => ({}))) as {
        enquiries?: Enquiry[];
        error?: string;
      };
      if (!res.ok) {
        if (!cancelled) setError(json.error || "Could not load enquiries");
        if (!cancelled) setRows([]);
        if (!cancelled) setLoading(false);
        return;
      }
      if (!cancelled) setRows(json.enquiries ?? []);
      if (!cancelled) setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateRow(updated: Enquiry) {
    setRows((current) =>
      current.map((row) => (row.id === updated.id ? updated : row)),
    );
  }

  async function setStatus(row: Enquiry, status: "contacted" | "closed_lost") {
    setBusyId(row.id);
    setError(null);
    const res = await fetch(`/api/admin/enquiries/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json().catch(() => null)) as
      | { error?: string; enquiry?: Enquiry }
      | null;
    setBusyId(null);
    if (!res.ok || !json?.enquiry) {
      setError(json?.error ?? "Could not update enquiry");
      return;
    }
    updateRow(json.enquiry);
  }

  async function convertToLead(row: Enquiry) {
    setBusyId(row.id);
    setError(null);
    const res = await fetch(`/api/admin/enquiries/${row.id}/convert-to-lead`, {
      method: "POST",
    });
    const json = (await res.json().catch(() => null)) as ConvertResponse | null;
    setBusyId(null);
    if (!res.ok || !json?.enquiry || !json.lead?.id) {
      setError(json?.error ?? "Could not convert enquiry");
      return;
    }
    updateRow(json.enquiry);
    setConvertedLeadIds((current) => ({
      ...current,
      [row.id]: json.lead?.id ?? "",
    }));
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Enquiries</h1>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Follow up every free learning gap check request and convert qualified
            parents into the lead pipeline.
          </p>
        </div>
        <Link
          href="/admin/leads"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Open Leads
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
            New
          </p>
          <p className="mt-2 text-2xl font-black text-neutral-900">{counts.new}</p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
            Contacted
          </p>
          <p className="mt-2 text-2xl font-black text-blue-700">
            {counts.contacted}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
            Converted
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-700">
            {counts.converted}
          </p>
        </div>
      </div>

      {loading ? <p className="text-sm text-neutral-500">Loading...</p> : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!loading && !error ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 font-medium">Mobile</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Learning Check Details</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const leadId = convertedLeadIds[row.id];
                const disabled = busyId === row.id || row.status === "converted";
                return (
                  <tr key={row.id} className="border-t border-neutral-100 align-top">
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      {row.name}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${row.mobile}`}
                        className="font-semibold text-blue-700"
                      >
                        {row.mobile}
                      </a>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {formatProgram(row.programInterest)}
                    </td>
                    <td className="max-w-sm whitespace-pre-line px-4 py-3 text-neutral-700">
                      {row.message || "No details shared"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          STATUS_CLASS[row.status] ?? STATUS_CLASS.new
                        }`}
                      >
                        {row.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="space-y-2 px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <a
                          href={whatsappHref(buildWhatsAppMessage(row))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
                        >
                          WhatsApp
                        </a>
                        <button
                          type="button"
                          disabled={busyId === row.id || row.status !== "new"}
                          onClick={() => setStatus(row, "contacted")}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Contacted
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => convertToLead(row)}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Convert
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id || row.status === "converted"}
                          onClick={() => setStatus(row, "closed_lost")}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Lost
                        </button>
                      </div>
                      {leadId ? (
                        <Link
                          href={`/admin/leads/${leadId}`}
                          className="inline-flex text-xs font-bold text-emerald-700"
                        >
                          Open converted lead
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
