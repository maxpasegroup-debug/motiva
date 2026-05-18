"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Option = {
  id: string;
  name: string;
};

type Props = {
  studentId: string;
  currentTeacherId: string;
  currentBatchId: string;
  teachers: Option[];
  batches: (Option & { duration: number })[];
};

export function MentorAllocationForm({
  studentId,
  currentTeacherId,
  currentBatchId,
  teachers,
  batches,
}: Props) {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState(currentTeacherId);
  const [batchId, setBatchId] = useState(currentBatchId);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch(`/api/mentor/students/${studentId}/allocation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, batchId }),
      });
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setMessage(body?.error ?? "Could not save allocation");
        return;
      }
      setMessage("Allocation saved");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Teacher and Batch Allocation</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Mentor can allocate or update the teacher and batch for this assigned student.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-neutral-700">
          Teacher
          <select
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
          >
            <option value="">Select teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-neutral-700">
          Batch
          <select
            value={batchId}
            onChange={(event) => setBatchId(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
          >
            <option value="">Select batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name} - {batch.duration} days
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={save}
          disabled={isPending || !teacherId || !batchId}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Allocation"}
        </button>
        {message ? <p className="text-sm font-medium text-neutral-600">{message}</p> : null}
      </div>
    </section>
  );
}
