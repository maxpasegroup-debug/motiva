"use client";

import { FormEvent, useState } from "react";

export default function ForgotPinPage() {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/forgot-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });

    const json = (await res.json().catch(() => ({}))) as { message?: string };
    setMessage(
      json.message ?? "Reset request submitted. Please contact your coordinator.",
    );
    setLoading(false);
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-neutral-900">Forgot PIN</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Submit your mobile number to request a PIN reset.
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
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit reset request"}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
