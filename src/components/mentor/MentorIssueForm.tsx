"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  defaultStudentId: string;
  currentUserId: string;
  students: {
    id: string;
    studentName: string;
  }[];
  assignees: {
    id: string;
    name: string;
    role: string;
  }[];
};

export function MentorIssueForm({
  defaultStudentId,
  currentUserId,
  students,
  assignees,
}: Props) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(defaultStudentId);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("academic");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState(currentUserId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/mentor/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId,
        title,
        category,
        priority,
        description,
        assignedToId,
      }),
    });

    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setSaving(false);
      setError(json?.error ?? "Could not create issue.");
      return;
    }

    router.push("/mentor/issues");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Student">
          <select
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            required
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.studentName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Assign To">
          <select
            value={assignedToId}
            onChange={(event) => setAssignedToId(event.target.value)}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            required
          >
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name} ({assignee.role})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            >
              <option value="academic">academic</option>
              <option value="behavioral">behavioral</option>
              <option value="attendance">attendance</option>
              <option value="emotional">emotional</option>
              <option value="other">other</option>
            </select>
          </Field>
          <Field label="Priority">
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </Field>
        </div>
      </div>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={6}
          className="rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-neutral-400"
          placeholder="Describe the issue clearly"
        />
      </Field>

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
        {saving ? "Saving..." : "Create Issue"}
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
