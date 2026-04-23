"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  defaultStudentId: string;
  students: {
    id: string;
    studentName: string;
    teacherId: string;
    teacherName: string;
  }[];
  teachers: {
    id: string;
    name: string;
  }[];
};

export function MentorScheduleForm({
  defaultStudentId,
  students,
  teachers,
}: Props) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(defaultStudentId);
  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId) ?? null,
    [studentId, students],
  );
  const [teacherId, setTeacherId] = useState(selectedStudent?.teacherId ?? "");
  const [subject, setSubject] = useState("");
  const [classType, setClassType] = useState("one-to-one");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleStudentChange(nextStudentId: string) {
    setStudentId(nextStudentId);
    const student = students.find((item) => item.id === nextStudentId) ?? null;
    setTeacherId(student?.teacherId ?? "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/mentor/schedule", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId,
        teacherId,
        subject,
        classType,
        scheduledDate,
        scheduledTime,
        durationMinutes,
        notes,
      }),
    });

    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setSaving(false);
      setError(json?.error ?? "Could not create class schedule.");
      return;
    }

    router.push("/mentor/schedule");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Student">
          <select
            value={studentId}
            onChange={(event) => handleStudentChange(event.target.value)}
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
        <Field label="Teacher">
          <select
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            required
          >
            <option value="">Select teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Subject">
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            required
          />
        </Field>
        <Field label="Class Type">
          <select
            value={classType}
            onChange={(event) => setClassType(event.target.value)}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
          >
            <option value="one-to-one">one-to-one</option>
            <option value="group">group</option>
          </select>
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            required
          />
        </Field>
        <Field label="Time">
          <input
            type="time"
            value={scheduledTime}
            onChange={(event) => setScheduledTime(event.target.value)}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
            required
          />
        </Field>
        <Field label="Duration in Minutes">
          <input
            type="number"
            min={15}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            className="min-h-11 rounded-2xl border border-neutral-200 px-4 py-2 outline-none focus:border-neutral-400"
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={5}
          className="rounded-2xl border border-neutral-200 px-4 py-3 outline-none focus:border-neutral-400"
          placeholder="Optional scheduling notes"
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
        {saving ? "Saving..." : "Create Schedule"}
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
