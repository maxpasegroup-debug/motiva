"use client";

import { FormEvent, useState } from "react";

export default function ForgotPinPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/forgot-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const json = (await res.json().catch(() => ({}))) as {
      message?: string;
      whatsappUrl?: string;
    };
    setMessage(json.message ?? "Please contact your coordinator on WhatsApp");
    setWhatsappUrl(json.whatsappUrl ?? null);
    setLoading(false);
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-neutral-900">Forgot PIN</h1>
        <p className="mt-1 text-sm text-neutral-600">
          PIN reset is handled by your coordinator on WhatsApp.
        </p>

        <form onSubmit={onSubmit} className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {loading ? "Opening..." : "Get WhatsApp Help"}
          </button>
        </form>

        {message ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <p>{message}</p>
            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex font-semibold text-emerald-900 underline"
              >
                Open WhatsApp
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
