"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getAuthToken } from "@/lib/session";

type Teacher = {
  id: string;
  name: string;
  subject: string;
  bio: string | null;
  photo: string | null;
  displayOrder: number;
  isVisible: boolean;
};

function authHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function AdminTeachersManagerPage() {
  const [rows, setRows] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/teachers", { headers: authHeader() });
    if (!res.ok) {
      setError("Could not load teachers");
      setRows([]);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { teachers: Teacher[] };
    setRows(data.teachers ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeTeacher(id: string) {
    if (!window.confirm("Delete this teacher profile?")) return;
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/teachers/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    });
    if (!res.ok) {
      setError("Delete failed");
      setBusyId(null);
      return;
    }
    setBusyId(null);
    await load();
  }

  async function patchTeacher(id: string, patch: Record<string, unknown>) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/teachers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      setError("Update failed");
      setBusyId(null);
      return;
    }
    setBusyId(null);
    await load();
  }

  async function move(id: string, dir: "up" | "down") {
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const j = dir === "up" ? idx - 1 : idx + 1;
    if (j < 0 || j >= rows.length) return;
    const a = rows[idx];
    const b = rows[j];
    if (!a || !b) return;
    await patchTeacher(a.id, { displayOrder: b.displayOrder });
    await patchTeacher(b.id, { displayOrder: a.displayOrder });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-neutral-900">Teacher Profiles</h1>
        <Link
          href="/admin/teachers/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Add Teacher
        </Link>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading teachers...</p>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          No teacher profiles yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Photo</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Visible</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, idx) => (
                <tr key={t.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-neutral-100">
                      {t.photo ? (
                        <Image
                          src={t.photo}
                          alt={t.name}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{t.name}</td>
                  <td className="px-4 py-3">{t.subject}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => patchTeacher(t.id, { isVisible: !t.isVisible })}
                      disabled={busyId === t.id}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        t.isVisible
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-neutral-200 text-neutral-700"
                      }`}
                    >
                      {t.isVisible ? "Visible" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3">{t.displayOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded border border-neutral-200 px-2 py-1 text-xs"
                        onClick={() => void move(t.id, "up")}
                        disabled={idx === 0 || busyId === t.id}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="rounded border border-neutral-200 px-2 py-1 text-xs"
                        onClick={() => void move(t.id, "down")}
                        disabled={idx === rows.length - 1 || busyId === t.id}
                      >
                        Down
                      </button>
                      <Link
                        href={`/admin/teachers/${t.id}/edit`}
                        className="rounded border border-neutral-200 px-2 py-1 text-xs"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                        onClick={() => void removeTeacher(t.id)}
                        disabled={busyId === t.id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
