"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BookOpen, GraduationCap, ShieldCheck, UsersRound } from "lucide-react";
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
      return "/admin/admissions";
    case "administrative_officer":
    case "manager":
    case "academic_coordinator":
      return "/admin";
    case "hr":
      return "/admin/users";
    case "demo_executive":
      return "/demo";
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
    <main className="min-h-screen bg-[#f7f8f4] px-4 py-8 text-neutral-950 sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1fr_420px]">
        <section className="overflow-hidden rounded-2xl bg-neutral-950 p-6 text-white shadow-2xl sm:p-8">
          <Link href="/" className="text-sm font-bold text-white/70 hover:text-white">
            Motiva Edus
          </Link>
          <h1 className="mt-8 max-w-2xl text-5xl font-black leading-none sm:text-6xl">
            Login opens the right dashboard.
          </h1>
          <p className="mt-5 max-w-xl text-base font-medium leading-7 text-white/72">
            Enter your mobile number and PIN. Students, parents, mentors,
            teachers, telecallers, and admins are sent to their own dashboard.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              [GraduationCap, "Student", "Classes, courses, attendance"],
              [UsersRound, "Parent", "Progress and fee visibility"],
              [BookOpen, "Mentor", "Students, admissions, batches"],
              [ShieldCheck, "Staff", "Admin and daily operations"],
            ].map(([Icon, title, text]) => (
              <div key={String(title)} className="rounded-xl border border-white/10 bg-white/10 p-4">
                <Icon className="h-5 w-5 text-[#25D366]" aria-hidden />
                <p className="mt-3 text-lg font-black">{String(title)}</p>
                <p className="mt-1 text-sm font-medium text-white/65">{String(text)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl shadow-neutral-900/5 sm:p-7">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#0B5ED7]">
              Secure access
            </p>
            <h2 className="mt-2 text-3xl font-black text-neutral-900">Login</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-neutral-600">
              Use mobile + PIN. Admin email/password also works for old admin accounts.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="flex flex-col gap-2 text-sm font-bold text-neutral-800">
              <span>Mobile number or admin email</span>
              <input
                type="text"
                inputMode="text"
                autoComplete="username"
                value={login}
                onChange={(event) => setLogin(event.target.value.trim())}
                className="min-h-12 rounded-lg border border-neutral-300 px-4 py-3 text-base outline-none transition focus:border-[#0B5ED7] focus:ring-2 focus:ring-blue-100"
                placeholder="Mobile number"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-neutral-800">
              <span>PIN or password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={credential}
                onChange={(event) => setCredential(event.target.value)}
                className="min-h-12 rounded-lg border border-neutral-300 px-4 py-3 text-base outline-none transition focus:border-[#0B5ED7] focus:ring-2 focus:ring-blue-100"
                placeholder="4 digit PIN"
                required
              />
            </label>

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Open Dashboard"}
            </button>
          </form>

          <div className="mt-5 grid gap-3 text-sm font-bold sm:grid-cols-2">
            <Link href="/auth/forgot-pin" className="rounded-lg border border-neutral-200 px-4 py-3 text-center text-neutral-700">
              Forgot PIN?
            </Link>
            <Link href="/services" className="rounded-lg border border-neutral-200 px-4 py-3 text-center text-neutral-700">
              View Services
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
