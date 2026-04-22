"use client";

import { useMemo, useState, useTransition } from "react";
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

type FieldErrors = Partial<
  Record<
    | "studentName"
    | "studentUsername"
    | "studentPin"
    | "studentConfirmPin"
    | "parentName"
    | "parentUsername"
    | "parentPin"
    | "parentConfirmPin",
    string
  >
>;

const USERNAME_RE = /^[a-zA-Z0-9]{4,}$/;
const PIN_RE = /^\d{4}$/;

function randomDigits() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function usernameSuggestion(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);
  return `${base || "student"}${randomDigits()}`;
}

function validate(values: {
  studentName: string;
  studentUsername: string;
  studentPin: string;
  studentConfirmPin: string;
  parentName: string;
  parentUsername: string;
  parentPin: string;
  parentConfirmPin: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.studentName.trim()) errors.studentName = "Student name is required.";
  if (!USERNAME_RE.test(values.studentUsername.trim())) {
    errors.studentUsername = "Username must be alphanumeric and at least 4 characters.";
  }
  if (!PIN_RE.test(values.studentPin)) {
    errors.studentPin = "PIN must be exactly 4 digits.";
  }
  if (values.studentPin !== values.studentConfirmPin) {
    errors.studentConfirmPin = "Student PINs do not match.";
  }

  if (!values.parentName.trim()) errors.parentName = "Parent name is required.";
  if (!USERNAME_RE.test(values.parentUsername.trim())) {
    errors.parentUsername = "Username must be alphanumeric and at least 4 characters.";
  }
  if (!PIN_RE.test(values.parentPin)) {
    errors.parentPin = "PIN must be exactly 4 digits.";
  }
  if (values.parentPin !== values.parentConfirmPin) {
    errors.parentConfirmPin = "Parent PINs do not match.";
  }

  return errors;
}

function CopyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-green-800/70">
          {label}
        </p>
        <p className="font-mono text-sm text-green-950">{value}</p>
      </div>
      <button
        type="button"
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-green-700 px-3 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-100"
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
  const programType = determineProgramTypeFromLead({
    type: lead.type,
    notes: lead.notes,
  });
  const programLabel = getProgramDisplayLabel(programType);

  const [studentName, setStudentName] = useState(lead.name);
  const [studentUsername, setStudentUsername] = useState("");
  const [studentPin, setStudentPin] = useState("");
  const [studentConfirmPin, setStudentConfirmPin] = useState("");
  const [parentName, setParentName] = useState(parentFromNotes ?? "");
  const [parentUsername, setParentUsername] = useState("");
  const [parentPin, setParentPin] = useState("");
  const [parentConfirmPin, setParentConfirmPin] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    studentAccountId: string;
    credentials: {
      student: { username: string; pin: string };
      parent: { username: string; pin: string };
    };
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const suggestedUsername = useMemo(
    () => usernameSuggestion(studentName),
    [studentName],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate({
      studentName,
      studentUsername,
      studentPin,
      studentConfirmPin,
      parentName,
      parentUsername,
      parentPin,
      parentConfirmPin,
    });
    setErrors(nextErrors);
    setSubmitError(null);
    if (Object.keys(nextErrors).length > 0) return;

    startTransition(async () => {
      const res = await fetch("/api/admin/admissions/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          studentName: studentName.trim(),
          studentUsername: studentUsername.trim(),
          studentPin,
          parentName: parentName.trim(),
          parentUsername: parentUsername.trim(),
          parentPin,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | {
            error?: string;
            fieldErrors?: FieldErrors;
            studentAccountId?: string;
            credentials?: {
              student: { username: string; pin: string };
              parent: { username: string; pin: string };
            };
          }
        | null;

      if (!res.ok || !json?.studentAccountId || !json.credentials) {
        setSubmitError(json?.error ?? "Could not create accounts.");
        setErrors(json?.fieldErrors ?? {});
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
        <h2 className="text-2xl font-bold text-green-950">
          Accounts Created Successfully
        </h2>
        <p className="mt-3 text-sm font-medium text-green-900">
          Save these credentials now. PINs cannot be retrieved after this screen.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="space-y-3 rounded-2xl bg-green-50 p-4">
            <h3 className="font-semibold text-green-950">Student Credentials</h3>
            <CopyField
              label="Username"
              value={created.credentials.student.username}
            />
            <CopyField label="PIN" value={created.credentials.student.pin} />
          </div>

          <div className="space-y-3 rounded-2xl bg-green-50 p-4">
            <h3 className="font-semibold text-green-950">Parent Credentials</h3>
            <CopyField
              label="Username"
              value={created.credentials.parent.username}
            />
            <CopyField label="PIN" value={created.credentials.parent.pin} />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            href={`/admin/admissions/assign-mentor/${lead.id}`}
            className="min-h-11 sm:w-auto"
          >
            Assign Mentor
          </Button>
          <Button
            href={`/admin/leads/${lead.id}`}
            variant="outline"
            className="min-h-11 sm:w-auto"
          >
            View Lead
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Student</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Create the student login credentials for this admission.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-neutral-700">
              Student Name
              <input
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
              {errors.studentName ? (
                <p className="mt-2 text-sm text-red-600">{errors.studentName}</p>
              ) : null}
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              Username for Student
              <input
                value={studentUsername}
                onChange={(event) => setStudentUsername(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Suggested: firstname + 4 random digits e.g. {suggestedUsername}
              </p>
              {errors.studentUsername ? (
                <p className="mt-2 text-sm text-red-600">{errors.studentUsername}</p>
              ) : null}
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              PIN for Student
              <input
                value={studentPin}
                onChange={(event) => setStudentPin(event.target.value)}
                inputMode="numeric"
                maxLength={4}
                className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
              {errors.studentPin ? (
                <p className="mt-2 text-sm text-red-600">{errors.studentPin}</p>
              ) : null}
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              Confirm PIN for Student
              <input
                value={studentConfirmPin}
                onChange={(event) => setStudentConfirmPin(event.target.value)}
                inputMode="numeric"
                maxLength={4}
                className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
              {errors.studentConfirmPin ? (
                <p className="mt-2 text-sm text-red-600">
                  {errors.studentConfirmPin}
                </p>
              ) : null}
            </label>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Parent</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Create the parent login credentials that will be shared after admission.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-neutral-700">
              Parent Name
              <input
                value={parentName}
                onChange={(event) => setParentName(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
              {errors.parentName ? (
                <p className="mt-2 text-sm text-red-600">{errors.parentName}</p>
              ) : null}
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              Username for Parent
              <input
                value={parentUsername}
                onChange={(event) => setParentUsername(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
              {errors.parentUsername ? (
                <p className="mt-2 text-sm text-red-600">{errors.parentUsername}</p>
              ) : null}
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              PIN for Parent
              <input
                value={parentPin}
                onChange={(event) => setParentPin(event.target.value)}
                inputMode="numeric"
                maxLength={4}
                className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
              {errors.parentPin ? (
                <p className="mt-2 text-sm text-red-600">{errors.parentPin}</p>
              ) : null}
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              Confirm PIN for Parent
              <input
                value={parentConfirmPin}
                onChange={(event) => setParentConfirmPin(event.target.value)}
                inputMode="numeric"
                maxLength={4}
                className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
              {errors.parentConfirmPin ? (
                <p className="mt-2 text-sm text-red-600">
                  {errors.parentConfirmPin}
                </p>
              ) : null}
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl bg-neutral-50 p-4">
          <h2 className="text-lg font-semibold text-foreground">Program Info</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Program Type
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-800">
                {programLabel}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Mobile
              </p>
              <p className="mt-1 text-sm font-semibold text-neutral-800">
                {lead.phone}
              </p>
            </div>
          </div>
        </section>

        {submitError ? (
          <p className="text-sm font-medium text-red-600">{submitError}</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="min-h-11 sm:w-auto" disabled={isPending}>
            {isPending ? "Creating..." : "Create Accounts"}
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
