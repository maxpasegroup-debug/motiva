"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Mentor = { id: string; name: string; email: string; mobile: string | null };
type TeacherOption = { id: string; name: string; email: string };
type BatchOption = { id: string; name: string; duration: number };

type StudentAccountInput = {
  id: string;
  studentName: string;
  programType: string;
  mentorId: string | null;
  teacherId: string | null;
  batchId: string | null;
};

type LeadInput = { id: string; name: string };

type Props = {
  lead: LeadInput;
  studentAccount: StudentAccountInput;
  mentors: Mentor[];
  teachers: TeacherOption[];
  batches: BatchOption[];
};

const isRemedial = (programType: string) =>
  programType === "remedial_12" || programType === "remedial_25";

export function AssignMentorForm({
  lead,
  studentAccount,
  mentors,
  teachers,
  batches,
}: Props) {
  const remedial = isRemedial(studentAccount.programType);

  const [mentorId, setMentorId] = useState(studentAccount.mentorId ?? "");
  const [teacherId, setTeacherId] = useState(studentAccount.teacherId ?? "");
  const [batchId, setBatchId] = useState(studentAccount.batchId ?? "");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    mentorName: string;
    teacherName: string;
    batchName?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!mentorId) {
      setSubmitError("Please select a mentor.");
      return;
    }
    if (!teacherId) {
      setSubmitError("Please select a teacher.");
      return;
    }
    if (remedial && !batchId) {
      setSubmitError("Please select a batch for this remedial program.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/admissions/assign-mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          studentAccountId: studentAccount.id,
          mentorId,
          teacherId,
          batchId: batchId || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const json = (await res.json().catch(() => null)) as {
        error?: string;
        mentorName?: string;
        teacherName?: string;
        batchName?: string;
      } | null;

      if (!res.ok) {
        setSubmitError(json?.error ?? "Could not assign mentor.");
        return;
      }

      setDone({
        mentorName: json?.mentorName ?? "",
        teacherName: json?.teacherName ?? "",
        batchName: json?.batchName,
      });
    });
  }

  if (done) {
    return (
      <Card className="max-w-2xl bg-green-100 p-6 ring-1 ring-inset ring-green-200 sm:p-8">
        <h2 className="text-2xl font-bold text-green-950">Mentor Assigned</h2>
        <div className="mt-4 space-y-2 text-sm text-green-900">
          <p>
            <span className="font-medium">Student:</span>{" "}
            {studentAccount.studentName}
          </p>
          <p>
            <span className="font-medium">Mentor:</span> {done.mentorName}
          </p>
          <p>
            <span className="font-medium">Teacher:</span> {done.teacherName}
          </p>
          {done.batchName ? (
            <p>
              <span className="font-medium">Batch:</span> {done.batchName}
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href={`/admin/leads/${lead.id}`} className="min-h-11 sm:w-auto">
            View Lead
          </Button>
          <Button
            href="/admin/leads"
            variant="outline"
            className="min-h-11 sm:w-auto"
          >
            Go to Leads List
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-neutral-50 px-4 py-3">
          <p className="text-sm text-neutral-500">
            Student:{" "}
            <span className="font-semibold text-neutral-800">
              {studentAccount.studentName}
            </span>
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Program:{" "}
            <span className="font-semibold text-neutral-800">
              {studentAccount.programType}
            </span>
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-700">
            Mentor <span className="text-red-500">*</span>
            <select
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
            >
              <option value="">Select mentor…</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Teacher <span className="text-red-500">*</span>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
            >
              <option value="">Select teacher…</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          {remedial ? (
            <label className="block text-sm font-medium text-neutral-700 sm:col-span-2">
              Batch <span className="text-red-500">*</span>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="">Select batch…</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.duration} days)
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        <label className="block text-sm font-medium text-neutral-700">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
            placeholder="Any notes about this assignment…"
          />
        </label>

        {submitError ? (
          <p className="text-sm font-medium text-red-600">{submitError}</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="submit"
            className="min-h-11 sm:w-auto"
            disabled={isPending}
          >
            {isPending ? "Assigning…" : "Assign Mentor"}
          </Button>
          <Button
            href={`/admin/leads/${lead.id}`}
            variant="outline"
            className="min-h-11 sm:w-auto"
          >
            Back to Lead
          </Button>
        </div>
      </form>
    </Card>
  );
}
