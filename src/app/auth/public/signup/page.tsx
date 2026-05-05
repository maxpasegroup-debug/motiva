"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function PublicSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{4}$/.test(pin) || pin !== confirmPin) {
      setError("PIN must be 4 digits and match confirmation.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/public/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, mobile, pin, confirmPin }),
    });

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      setError(json.error || "Signup failed");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center px-4 py-8">
      <div className="w-full rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-neutral-900">Public Sign Up</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Create your account with your mobile number and PIN.
        </p>

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
              onChange={(e) =>
                setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
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
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              required
            />
          </div>
          <div>
            <label
              className="mb-1 block text-sm font-medium text-neutral-700"
              htmlFor="confirmPin"
            >
              Confirm PIN
            </label>
            <input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5"
              value={confirmPin}
              onChange={(e) =>
                setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-sm">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Already have an account? Login
          </Link>
        </p>
      </div>
    </main>
  );
}
