"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TeacherOption = { id: string; name: string };
type BatchOption = { id: string; name: string; duration: number; teacherId: string };

type Props = {
  teachers: TeacherOption[];
  batches: BatchOption[];
};

const PROGRAMS = [
  { value: "tuition", label: "Tuition" },
  { value: "foundation", label: "Foundation" },
  { value: "remedial_12", label: "12-Day Remedial" },
  { value: "remedial_25", label: "25-Day Remedial" },
  { value: "spoken_english", label: "Spoken English" },
  { value: "madrassa", label: "Madrassa" },
] as const;

export function MentorAdmissionForm({ teachers, batches }: Props) {
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [programType, setProgramType] = useState<(typeof PROGRAMS)[number]["value"]>(
    "tuition",
  );
  const [subject, setSubject] = useState("");
  const [totalFee, setTotalFee] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [batchId, setBatchId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const teacherBatches = useMemo(
    () => batches.filter((batch) => batch.teacherId === teacherId),
    [batches, teacherId],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setCreatedStudentId(null);

    startTransition(async () => {
      const res = await fetch("/api/mentor/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          parentName,
          phone,
          programType,
          subject,
          totalFee: Number(totalFee),
          amountPaid: Number(amountPaid),
          teacherId,
          batchId,
          remarks,
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | {
            error?: string;
            leadId?: string;
            studentAccountId?: string | null;
            paymentStatus?: string;
            onboarding?: { ok: boolean; warnings?: string[]; error?: string } | null;
          }
        | null;

      if (!res.ok || !body?.leadId) {
        setMessage(body?.error ?? "Could not create admission");
        return;
      }

      const warnings =
        body.onboarding && "warnings" in body.onboarding
          ? body.onboarding.warnings ?? []
          : [];
      setMessage(
        body.paymentStatus === "paid"
          ? warnings.length
            ? `Admission created. Dashboard created, but needs action: ${warnings.join(" ")}`
            : "Admission created. Student and parent dashboards are active."
          : "Admission created with part payment. Complete fees to activate dashboard.",
      );
      setCreatedStudentId(body.studentAccountId ?? null);
      setStudentName("");
      setParentName("");
      setPhone("");
      setSubject("");
      setTotalFee("");
      setAmountPaid("");
      setRemarks("");
      setBatchId("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Student name" value={studentName} onChange={setStudentName} />
        <TextField label="Parent name" value={parentName} onChange={setParentName} />
        <TextField label="Phone" value={phone} onChange={setPhone} />
        <label className="block text-sm font-medium text-neutral-700">
          Program
          <select
            value={programType}
            onChange={(event) => setProgramType(event.target.value as typeof programType)}
            className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
          >
            {PROGRAMS.map((program) => (
              <option key={program.value} value={program.value}>
                {program.label}
              </option>
            ))}
          </select>
        </label>
        <TextField label="Subject / need" value={subject} onChange={setSubject} />
        <TextField
          label="Total fee"
          value={totalFee}
          onChange={setTotalFee}
          type="number"
        />
        <TextField
          label="Amount paid"
          value={amountPaid}
          onChange={setAmountPaid}
          type="number"
        />
        <label className="block text-sm font-medium text-neutral-700">
          Teacher
          <select
            value={teacherId}
            onChange={(event) => {
              setTeacherId(event.target.value);
              setBatchId("");
            }}
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
            {teacherBatches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name} - {batch.duration} days
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-neutral-700">
        Remarks
        <textarea
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          className="mt-2 min-h-24 w-full rounded-lg border border-neutral-300 px-3 py-3 text-sm"
          placeholder="Payment mode, receipt number, class timing, or admission remarks"
        />
      </label>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isPending || !teacherId || !batchId}
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create Admission"}
        </button>
        {message ? (
          <Link
            href={
              createdStudentId
                ? `/mentor/students/${createdStudentId}`
                : "/mentor/students"
            }
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800"
          >
            {createdStudentId ? "Open Student" : "View Students"}
          </Link>
        ) : null}
        {message ? <p className="text-sm font-medium text-neutral-700">{message}</p> : null}
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      <input
        required
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "1" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-3 text-sm"
      />
    </label>
  );
}
