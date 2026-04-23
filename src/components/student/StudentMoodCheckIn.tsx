"use client";

import { useState } from "react";
import { getMoodEmoji } from "@/lib/portal";

type Props = {
  existingMood: {
    rating: number;
    date: string;
  } | null;
};

const OPTIONS = [1, 2, 3, 4, 5] as const;

export function StudentMoodCheckIn({ existingMood }: Props) {
  const [submittedMood, setSubmittedMood] = useState(existingMood);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitMood(rating: number) {
    setSaving(true);
    setError(null);

    const response = await fetch("/api/student/mood", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rating }),
    });

    const json = (await response.json().catch(() => null)) as
      | { error?: string; record?: { rating: number; date: string } }
      | null;

    if (!response.ok || !json?.record) {
      setSaving(false);
      setError(json?.error ?? "Could not save your mood.");
      return;
    }

    setSubmittedMood({
      rating: json.record.rating,
      date: json.record.date,
    });
    setSaving(false);
  }

  if (submittedMood) {
    return (
      <div className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
        Thanks for checking in! Today&apos;s rating: {getMoodEmoji(submittedMood.rating)}{" "}
        ({submittedMood.rating}/5)
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {OPTIONS.map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => submitMood(rating)}
            disabled={saving}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-2xl transition hover:border-neutral-400 disabled:opacity-60"
          >
            {getMoodEmoji(rating)}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
