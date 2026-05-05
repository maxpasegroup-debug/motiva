"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function EnrollButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enroll() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Could not enroll");
      }
      router.push(`/dashboard/courses/${courseId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enroll");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={enroll}
        disabled={busy}
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? "Enrolling..." : "Enroll"}
      </button>
      {error ? <p className="text-sm font-medium text-accent">{error}</p> : null}
    </div>
  );
}
