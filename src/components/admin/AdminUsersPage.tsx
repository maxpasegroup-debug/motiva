"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Role } from "@/lib/roles";

type AdminUser = {
  id: string;
  name: string;
  mobile: string | null;
  role: Role;
  isActive: boolean;
  pinResetRequired: boolean;
  createdAt: string;
};

const ROLES: Role[] = [
  "admin",
  "telecounselor",
  "demo_executive",
  "mentor",
  "teacher",
  "student",
  "parent",
  "public",
];

function generatePin() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [pin, setPin] = useState(generatePin);
  const [message, setMessage] = useState<string | null>(null);
  const [oneTimePin, setOneTimePin] = useState<{ name: string; pin: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadUsers() {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    if (!res.ok) {
      setMessage("Could not load users");
      return;
    }
    const body = (await res.json()) as { users?: AdminUser[] };
    setUsers(body.users ?? []);
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, role, pin }),
      });
      const body = (await res.json().catch(() => null)) as
        | { error?: string; user?: AdminUser }
        | null;
      if (!res.ok) throw new Error(body?.error ?? "Could not create user");
      setOneTimePin({ name, pin });
      setName("");
      setMobile("");
      setRole("student");
      setPin(generatePin());
      await loadUsers();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not create user");
    } finally {
      setBusy(false);
    }
  }

  async function resetPin(user: AdminUser) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-pin`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => null)) as
        | { error?: string; pin?: string }
        | null;
      if (!res.ok || !body?.pin) throw new Error(body?.error ?? "Could not reset PIN");
      setOneTimePin({ name: user.name, pin: body.pin });
      await loadUsers();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not reset PIN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Users</h1>
        <p className="mt-1 text-sm text-neutral-600">Unified login accounts</p>
      </div>

      <form onSubmit={createUser} className="grid gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm"
        />
        <input
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="Mobile"
          inputMode="numeric"
          className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm"
        >
          {ROLES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          inputMode="numeric"
          maxLength={4}
          className="min-h-11 rounded-lg border border-neutral-300 px-3 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white disabled:opacity-70"
        >
          Add User
        </button>
      </form>

      {message ? <p className="text-sm font-medium text-accent">{message}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Mobile</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 font-medium text-neutral-900">{user.name}</td>
                <td className="px-4 py-3 text-neutral-700">{user.mobile ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {user.isActive ? "Active" : "Inactive"}
                  {user.pinResetRequired ? " - reset required" : ""}
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => resetPin(user)}
                    disabled={busy}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-70"
                  >
                    Reset PIN
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {oneTimePin ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-neutral-900">One-time PIN</h2>
            <p className="mt-2 text-sm text-neutral-600">{oneTimePin.name}</p>
            <p className="mt-4 rounded-lg bg-neutral-100 px-4 py-3 text-center font-mono text-2xl font-bold text-neutral-900">
              {oneTimePin.pin}
            </p>
            <button
              type="button"
              onClick={() => setOneTimePin(null)}
              className="mt-5 min-h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
