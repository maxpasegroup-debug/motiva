"use client";

import { useEffect, useMemo, useState } from "react";

type PinResetRequest = {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  requestedAt: string;
};

type ApproveResponse = {
  success: boolean;
  pin: string;
  userId: string;
  mobile: string;
};

export default function AdminPinResetRequestsPage() {
  const [rows, setRows] = useState<PinResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revealedPin, setRevealedPin] = useState<ApproveResponse | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pin-reset-requests", {
        cache: "no-store",
      });
      const json = (await res.json()) as { requests?: PinResetRequest[]; error?: string };
      if (!res.ok) throw new Error(json.error || "Could not load requests");
      setRows(json.requests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(row: PinResetRequest) {
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pin-reset-requests/${row.id}/approve`, {
        method: "POST",
      });
      const json = (await res.json()) as ApproveResponse & { error?: string };
      if (!res.ok) throw new Error(json.error || "Could not approve request");
      setRevealedPin(json);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not approve request");
    } finally {
      setBusyId(null);
    }
  }

  const content = useMemo(() => {
    if (loading) {
      return <p className="text-sm text-gray-500">Loading pending requests...</p>;
    }
    if (rows.length === 0) {
      return <p className="text-sm text-gray-500">No pending PIN reset requests.</p>;
    }
    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Mobile</th>
              <th className="px-4 py-3 font-medium">Requested</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">{row.mobile}</td>
                <td className="px-4 py-3">
                  {new Date(row.requestedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={busyId === row.id}
                    onClick={() => {
                      void approve(row);
                    }}
                  >
                    {busyId === row.id ? "Approving..." : "Approve"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [busyId, loading, rows]);

  return (
    <main className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">PIN Reset Requests</h1>
        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          onClick={() => {
            void load();
          }}
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {content}

      {revealedPin ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold">New PIN Generated</h2>
            <p className="mt-2 text-sm text-gray-600">
              Share this PIN with the user. It will not be shown again.
            </p>
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
              <div className="text-xs uppercase tracking-wide text-blue-700">PIN</div>
              <div className="mt-1 text-3xl font-bold tracking-widest text-blue-900">
                {revealedPin.pin}
              </div>
              <div className="mt-2 text-xs text-blue-800">
                Mobile: {revealedPin.mobile}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white"
                onClick={() => setRevealedPin(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
