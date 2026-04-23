"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSessionToken } from "@/lib/session";

export default function PublicLoginPage() {
  const router = useRouter();
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/public/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, pin }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      token?: string;
      error?: string;
      requiresPinReset?: boolean;
    };

    if (!res.ok) {
      setError(json.error || "Login failed");
      setLoading(false);
      return;
    }

    if (json.token) {
      saveSessionToken(json.token);
    }

    if (json.requiresPinReset) {
      router.push("/auth/set-new-pin");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center px-4 py-8">
      <div className="w-full rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-neutral-900">Public Login</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Use mobile number and 4-digit PIN.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label
              className="mb-1 block text-sm font-medium text-neutral-700"
              htmlFor="mobile"
            >
              Mobile number
            </label>
            <input
              id="mobile"
              inputMode="numeric"
              maxLength={10}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-neutral-700"
              htmlFor="pin"
            >
              4-digit PIN
            </label>
            <input
              id="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-sm">
          <p>
            <Link
              href="/auth/public/signup"
              className="font-medium text-primary hover:underline"
            >
              New here? Sign up
            </Link>
          </p>
          <p>
            <Link
              href="/auth/forgot-pin"
              className="font-medium text-primary hover:underline"
            >
              Forgot PIN?
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
