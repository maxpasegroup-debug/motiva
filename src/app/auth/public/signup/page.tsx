"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function PublicSignupPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/public/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mobile }),
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setError(json.error || "Signup failed");
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center px-4 py-8">
      <div className="w-full rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-neutral-900">Public Sign Up</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Create your account to start learning.
        </p>

        {!done ? (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-neutral-700"
                htmlFor="name"
              >
                Name
              </label>
              <input
                id="name"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Sign up"}
            </button>
          </form>
        ) : (
          <p className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Account created. Your coordinator will share your PIN.
          </p>
        )}

        <p className="mt-4 text-sm">
          <Link
            href="/auth/public/login"
            className="font-medium text-primary hover:underline"
          >
            Already have an account? Login
          </Link>
        </p>
      </div>
    </main>
  );
}
