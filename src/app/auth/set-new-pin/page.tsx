"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isRole, type Role } from "@/lib/roles";

type MeResponse = {
  role: Role;
};

function roleDestination(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "mentor":
      return "/mentor";
    case "teacher":
      return "/teacher";
    case "student":
      return "/student";
    case "parent":
      return "/parent";
    case "telecounselor":
    case "demo_executive":
      return "/admin/leads";
    case "public":
      return "/dashboard";
    default:
      return "/";
  }
}

export default function SetNewPinPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>("public");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      const json = (await res.json().catch(() => null)) as MeResponse | null;
      setRole(isRole(json?.role) ? json.role : "public");
      setReady(true);
    }

    void checkSession();
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{4}$/.test(newPin) || newPin !== confirmPin) {
      setError("New PIN must be 4 digits and match confirmation.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/set-new-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ newPin, confirmPin }),
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setError(json.error || "Could not set new PIN");
      setLoading(false);
      return;
    }

    router.push(roleDestination(role));
    router.refresh();
  }

  if (!ready) return null;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-neutral-900">Set New PIN</h1>
        <p className="mt-1 text-sm text-neutral-600">
          For security, update your PIN before continuing.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="New PIN (4 digits)"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5"
            value={newPin}
            onChange={(e) =>
              setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            required
          />
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="Confirm new PIN"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2.5"
            value={confirmPin}
            onChange={(e) =>
              setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            required
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {loading ? "Saving..." : "Update PIN"}
          </button>
        </form>
      </div>
    </main>
  );
}
