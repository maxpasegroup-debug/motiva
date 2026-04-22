"use client";

import { useEffect, useState } from "react";

type Enquiry = {
  id: string;
  name: string;
  mobile: string;
  programInterest: string;
  message: string | null;
  status: string;
  createdAt: string;
};

export default function AdminEnquiriesPage() {
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Enquiries</h1>

      {loading ? <p className="text-sm text-neutral-500">Loading...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Mobile</th>
                <th className="px-4 py-3 font-medium">Program</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3">{r.mobile}</td>
                  <td className="px-4 py-3">{r.programInterest}</td>
                  <td className="px-4 py-3">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
