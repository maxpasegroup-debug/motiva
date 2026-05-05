"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  determineProgramTypeFromLead,
  extractParentNameFromLeadNotes,
  getProgramDisplayLabel,
} from "@/lib/leads";

type LeadInput = {
  id: string;
  name: string;
  phone: string;
  notes: string | null;
  type?: string | null;
};

type Props = {
  lead: LeadInput;
};

function digits10(raw: string) {
  return raw.replace(/\D/g, "").slice(-10);
}

function randomPin() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-4 py-3">
      <div>
        <p className="text-xs font-medium uppercase text-green-800/70">{label}</p>
        <p className="font-mono text-sm text-green-950">{value}</p>
      </div>
      <button
        type="button"
        className="min-h-10 rounded-lg border border-green-700 px-3 text-sm font-semibold text-green-800"
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function CreateAccountForm({ lead }: Props) {
  const parentFromNotes = extractParentNameFromLeadNotes(lead.notes);
  const programType = determineProgramTypeFromLead({ type: lead.type, notes: lead.notes });
  const programLabel = getProgramDisplayLabel(programType);

  const [studentName, setStudentName] = useState(lead.name);
  const [studentMobile, setStudentMobile] = useState(digits10(lead.phone));
  const [studentPin, setStudentPin] = useState(randomPin);
  const [parentName, setParentName] = useState(parentFromNotes ?? "");
  const [parentMobile, setParentMobile] = useState(digits10(lead.phone));
  const [parentPin, setParentPin] = useState(randomPin);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    studentAccountId: string;
    credentials: {
      student: { mobile: string; pin: string };
      parent: { mobile: string; pin: string };
    };
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const mobile = digits10(studentMobile);
    const pMobile = digits10(parentMobile);
    if (!studentName.trim() || !parentName.trim()) {
      setSubmitError("Student and parent names are required.");
      return;
    }
    if (!/^\d{10}$/.test(mobile) || !/^\d{10}$/.test(pMobile)) {
      setSubmitError("Student and parent mobile numbers must be 10 digits.");
      return;
    }
    if (!/^\d{4}$/.test(studentPin) || !/^\d{4}$/.test(parentPin)) {
      setSubmitError("Student and parent PINs must be 4 digits.");
      return;
    }
    if (mobile === pMobile && studentPin === parentPin) {
      setSubmitError("Use different PINs when both accounts share one mobile number.");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/admissions/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          studentName: studentName.trim(),
          mobile,
          studentPin,
          parentName: parentName.trim(),
          parentMobile: pMobile,
          parentPin,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | {
            error?: string;
            studentAccountId?: string;
            credentials?: {
              student: { mobile: string; pin: string };
              parent: { mobile: string; pin: string };
            };
          }
        | null;

      if (!res.ok || !json?.studentAccountId || !json.credentials) {
        setSubmitError(json?.error ?? "Could not create accounts.");
        return;
      }

      setCreated({
        studentAccountId: json.studentAccountId,
        credentials: json.credentials,
      });
    });
  }

  if (created) {
    return (
      <Card className="max-w-3xl bg-green-100 p-6 ring-1 ring-inset ring-green-200 sm:p-8">
        <h2 className="text-2xl font-bold text-green-950">Accounts Created Successfully</h2>
        <p className="mt-3 text-sm font-medium text-green-900">
          Save these credentials now. PINs cannot be retrieved after this screen.
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-3 rounded-lg bg-green-50 p-4">
            <h3 className="font-semibold text-green-950">Student Credentials</h3>
            <CopyField label="Mobile" value={created.credentials.student.mobile} />
            <CopyField label="PIN" value={created.credentials.student.pin} />
          </div>
          <div className="space-y-3 rounded-lg bg-green-50 p-4">
            <h3 className="font-semibold text-green-950">Parent Credentials</h3>
            <CopyField label="Mobile" value={created.credentials.parent.mobile} />
            <CopyField label="PIN" value={created.credentials.parent.pin} />
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button href={`/admin/admissions/assign-mentor/${lead.id}`} className="min-h-11 sm:w-auto">
            Assign Mentor
          </Button>
          <Button href={`/admin/leads/${lead.id}`} variant="outline" className="min-h-11 sm:w-auto">
            View Lead
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-700">
            Student Name
            <input value={studentName} onChange={(e) => setStudentName(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4" />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Student Mobile
            <input value={studentMobile} onChange={(e) => setStudentMobile(e.target.value)} inputMode="numeric" className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4" />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Student PIN
            <input value={studentPin} onChange={(e) => setStudentPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" maxLength={4} className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4" />
          </label>
          <Button type="button" variant="outline" onClick={() => setStudentPin(randomPin())}>
            Generate Student PIN
          </Button>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-700">
            Parent Name
            <input value={parentName} onChange={(e) => setParentName(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4" />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Parent Mobile
            <input value={parentMobile} onChange={(e) => setParentMobile(e.target.value)} inputMode="numeric" className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4" />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Parent PIN
            <input value={parentPin} onChange={(e) => setParentPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" maxLength={4} className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4" />
          </label>
          <Button type="button" variant="outline" onClick={() => setParentPin(randomPin())}>
            Generate Parent PIN
          </Button>
        </section>

        <section className="rounded-lg bg-neutral-50 p-4">
          <p className="text-xs font-medium uppercase text-neutral-500">Program Type</p>
          <p className="mt-1 text-sm font-semibold text-neutral-800">{programLabel}</p>
        </section>

        {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="min-h-11 sm:w-auto" disabled={isPending}>
            {isPending ? "Creating..." : "Create Accounts"}
          </Button>
          <Button href={`/admin/leads/${lead.id}`} variant="outline" className="min-h-11 sm:w-auto">
            Back to Lead
          </Button>
        </div>
      </form>
    </Card>
  );
}
