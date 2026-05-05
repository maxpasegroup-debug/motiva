"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSessionToken } from "@/lib/session";

type LoginResponse = {
  error?: string;
  requiresPinReset?: boolean;
  token?: string;
  role?: string;
  user?: {
    role: string;
  };
};

function roleDestination(role: string): string {
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
      return "/admin/leads";
    case "demo_executive":
      return "/demo";
    default:
      return "/";
  }
}

export function InternalLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mobile: username,
        pin,
      }),
    });

    const json = (await response.json().catch(() => null)) as LoginResponse | null;

    if (!response.ok) {
      setSubmitting(false);
      setError(json?.error ?? "Could not sign you in.");
      return;
    }

    if (json?.requiresPinReset) {
      router.push("/auth/set-new-pin");
      router.refresh();
      return;
    }

    if (json?.token) {
      saveSessionToken(json.token);
    }

    router.push(roleDestination(json?.role ?? json?.user?.role ?? ""));
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-xl shadow-neutral-900/5 sm:p-8">
        <div>
          <p className="text-sm font-medium text-neutral-500">Motiva Edus</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">Internal Login</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Students, parents, teachers, mentors, and internal teams sign in here.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
            <span>Mobile number</span>
            <input
              type="text"
              inputMode="numeric"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="min-h-12 rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
            <span>PIN</span>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              className="min-h-12 rounded-2xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
              required
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-sm">
          <Link href="/auth/public/login" className="font-medium text-neutral-900">
            Public user? Login here
          </Link>
          <Link href="/auth/forgot-pin" className="font-medium text-neutral-500">
            Forgot PIN?
          </Link>
        </div>
      </div>
    </main>
  );
}
