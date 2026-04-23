"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LearningPlanSubject } from "@/lib/mentor";

type ExistingPlan = {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  goals: string;
  revisionCycle: string;
  notes: string;
  subjects: LearningPlanSubject[];
};

type Props = {
  studentId: string;
  studentName: string;
  existingPlan?: ExistingPlan;
};

const REVISION_OPTIONS = [
  "Every 3 days",
  "Every 5 days",
  "Every 7 days",
  "Custom",
];

export function LearningPlanForm({
  studentId,
  studentName,
  existingPlan,
}: Props) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(
    existingPlan?.startDate ?? new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(existingPlan?.endDate ?? "");
  const [status, setStatus] = useState(existingPlan?.status ?? "active");
  const [subjects, setSubjects] = useState<LearningPlanSubject[]>(
    existingPlan?.subjects.length
      ? existingPlan.subjects
      : [{ subjectName: "", dailyTargetMinutes: 60, notes: "" }],
  );
  const [goals, setGoals] = useState(existingPlan?.goals ?? "");
  const [revisionCycle, setRevisionCycle] = useState(
    existingPlan?.revisionCycle ?? "Every 7 days",
  );
  const [notes, setNotes] = useState(existingPlan?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSubject(
    index: number,
    field: keyof LearningPlanSubject,
    value: string | number,
  ) {
    setSubjects((current) =>
      current.map((subject, subjectIndex) =>
        subjectIndex === index ? { ...subject, [field]: value } : subject,
      ),
    );
  }

  function addSubject() {
    setSubjects((current) => [
      ...current,
      { subjectName: "", dailyTargetMinutes: 60, notes: "" },
    ]);
  }

  function removeSubject(index: number) {
    setSubjects((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const cleanSubjects = subjects
      .map((subject) => ({
        subjectName: subject.subjectName.trim(),
        dailyTargetMinutes: Number(subject.dailyTargetMinutes) || 0,
        notes: subject.notes.trim(),
      }))
      .filter((subject) => subject.subjectName);

    if (cleanSubjects.length === 0) {
      setSaving(false);
      setError("Add at least one subject before saving the plan.");
      return;
    }

    const payload = {
      planId: existingPlan?.id,
      studentId,
      startDate,
      endDate,
      status,
      subjects: cleanSubjects,
      goals,
      revisionCycle,
      notes,
    };

    const response = await fetch("/api/mentor/learning-plans", {
      method: existingPlan ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setSaving(false);
      setError(json?.error ?? "Could not save the learning plan.");
      return;
    }

    router.push(`/mentor/students/${studentId}?tab=plan`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">{studentName}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Build a structured plan with subject targets, goals, and revision cadence.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Start Date">
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            required
          />
        </Field>
        <Field label="End Date">
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            required
          />
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
          >
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="completed">completed</option>
          </select>
        </Field>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Subjects</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Add daily targets and notes for each learning area.
            </p>
          </div>
          <button
            type="button"
            onClick={addSubject}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Add Subject
          </button>
        </div>

        {subjects.map((subject, index) => (
          <div
            key={`${index}-${subject.subjectName}`}
            className="grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[1.1fr_0.7fr_1fr_auto]"
          >
            <Field label="Subject Name">
              <input
                type="text"
                value={subject.subjectName}
                onChange={(event) => updateSubject(index, "subjectName", event.target.value)}
                className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
                placeholder="Mathematics"
              />
            </Field>
            <Field label="Daily Target Minutes">
              <input
                type="number"
                min={0}
                value={subject.dailyTargetMinutes}
                onChange={(event) =>
                  updateSubject(index, "dailyTargetMinutes", Number(event.target.value))
                }
                className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
              />
            </Field>
            <Field label="Notes">
              <input
                type="text"
                value={subject.notes}
                onChange={(event) => updateSubject(index, "notes", event.target.value)}
                className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
                placeholder="Focus on word problems"
              />
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => removeSubject(index)}
                disabled={subjects.length === 1}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Goals">
          <textarea
            value={goals}
            onChange={(event) => setGoals(event.target.value)}
            rows={5}
            className="rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-neutral-400"
            placeholder="Overall goals for this student"
          />
        </Field>
        <div className="space-y-4">
          <Field label="Revision Cycle">
            <select
              value={revisionCycle}
              onChange={(event) => setRevisionCycle(event.target.value)}
              className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            >
              {REVISION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={5}
              className="rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-neutral-400"
              placeholder="Additional mentor notes"
            />
          </Field>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving..." : existingPlan ? "Update Plan" : "Create Plan"}
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-neutral-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
