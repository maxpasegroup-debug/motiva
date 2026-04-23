"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  getCategoryClasses,
  getIssueStatusClasses,
  getPriorityClasses,
  humanizeSnakeCase,
} from "@/lib/mentor";

type TimelineItem = {
  text: string;
  status?: string;
  displayName: string;
  timestampLabel: string;
};

type Props = {
  issueId: string;
  title: string;
  studentName: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  timeline: TimelineItem[];
};

export function MentorIssueDetailView({
  issueId,
  title,
  studentName,
  category,
  priority,
  status,
  description,
  timeline,
}: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitUpdate(nextStatus?: string) {
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/mentor/issues/${issueId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: nextStatus,
        note,
      }),
    });

    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setSaving(false);
      setError(json?.error ?? "Could not update issue.");
      return;
    }

    setNote("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
            <p className="mt-2 text-sm text-neutral-600">Student: {studentName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getCategoryClasses(category)}`}>
              {humanizeSnakeCase(category)}
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getPriorityClasses(priority)}`}>
              {humanizeSnakeCase(priority)}
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getIssueStatusClasses(status)}`}>
              {humanizeSnakeCase(status)}
            </span>
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-700">
          {description || "No description added for this issue."}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Timeline</h2>
          <div className="mt-5 space-y-4">
            {timeline.length > 0 ? (
              timeline.map((entry, index) => (
                <div
                  key={`${entry.timestampLabel}-${index}`}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <p className="text-sm font-medium text-neutral-900">{entry.text}</p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {entry.displayName} • {entry.timestampLabel}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
                No timeline updates yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">Update Issue</h2>
          <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-neutral-700">
            <span>Add Note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={6}
              className="rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-neutral-400"
              placeholder="Add a progress note or resolution update"
            />
          </label>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => submitUpdate("in_progress")}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Mark In Progress
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => submitUpdate("resolved")}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Mark Resolved
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => submitUpdate("open")}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-60"
            >
              Reopen
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => submitUpdate()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Note"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
