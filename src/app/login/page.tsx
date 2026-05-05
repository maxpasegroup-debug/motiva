"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { isRole, type Role } from "@/lib/roles";
import { saveSessionToken } from "@/lib/session";

type LoginResponse = {
  success?: boolean;
  role?: string;
  requiresPinReset?: boolean;
  token?: string;
  error?: string;
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

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [credential, setCredential] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const isEmailLogin = login.includes("@");
    const response = await fetch(isEmailLogin ? "/api/admin/login" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(
        isEmailLogin
          ? { login: login.trim(), password: credential }
          : { mobile: login, pin: credential },
      ),
    });

    const json = (await response.json().catch(() => null)) as LoginResponse | null;

    if (!response.ok) {
      setSubmitting(false);
      setError(json?.error ?? "Invalid mobile number or PIN");
      return;
    }

    if (json?.token) {
      saveSessionToken(json.token);
    }

    if (json?.requiresPinReset) {
      router.push("/auth/set-new-pin");
      router.refresh();
      return;
    }

    const role = isRole(json?.role) ? json.role : "public";
    router.push(roleDestination(role));
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center px-4 py-10 sm:px-6">
      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl shadow-neutral-900/5 sm:p-8">
        <div>
          <p className="text-sm font-medium text-neutral-500">Motiva Edus</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">Login</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Use mobile and PIN, or legacy admin email and password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
            <span>Mobile number or admin email</span>
            <input
              type="text"
              inputMode="text"
              autoComplete="username"
              value={login}
              onChange={(event) => setLogin(event.target.value.trim())}
              className="min-h-12 rounded-xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
            <span>PIN or password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={credential}
              onChange={(event) => setCredential(event.target.value)}
              className="min-h-12 rounded-xl border border-neutral-200 px-4 py-3 outline-none transition focus:border-neutral-400"
              required
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-sm">
          <Link href="/auth/public/signup" className="font-medium text-neutral-900">
            New public user? Sign up
          </Link>
          <Link href="/auth/forgot-pin" className="font-medium text-neutral-500">
            Forgot PIN?
          </Link>
        </div>
      </div>
    </main>
  );
}
