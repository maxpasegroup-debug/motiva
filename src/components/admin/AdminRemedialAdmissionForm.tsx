"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ProgramType = "remedial_12" | "remedial_25";

type FieldErrors = Partial<Record<
  "studentName" | "parentName" | "mobile" | "email" | "programType" | "feeAmount" | "notes",
  string
>>;

const MOBILE_RE = /^\d{10}$/;

function normalizeMobile(value: string) {
  return value.replace(/\D/g, "");
}

function validateForm(input: {
  studentName: string;
  parentName: string;
  mobile: string;
  email: string;
  programType: string;
  feeAmount: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.studentName.trim()) {
    errors.studentName = "Student name is required.";
  }
  if (!input.parentName.trim()) {
    errors.parentName = "Parent name is required.";
  }

  const mobile = normalizeMobile(input.mobile);
  if (!MOBILE_RE.test(mobile)) {
    errors.mobile = "Mobile number must be exactly 10 digits.";
  }

  if (
    input.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())
  ) {
    errors.email = "Enter a valid email address.";
  }

  if (input.programType !== "remedial_12" && input.programType !== "remedial_25") {
    errors.programType = "Select a remedial program.";
  }

  const feeAmount = Number(input.feeAmount);
  if (!input.feeAmount.trim() || !Number.isFinite(feeAmount) || feeAmount <= 0) {
    errors.feeAmount = "Fee amount must be greater than 0.";
  }

  return errors;
}

export function AdminRemedialAdmissionForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [programType, setProgramType] = useState<ProgramType>("remedial_12");
  const [feeAmount, setFeeAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm({
      studentName,
      parentName,
      mobile,
      email,
      programType,
      feeAmount,
    });
    setFieldErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/admissions/remedial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          parentName: parentName.trim(),
          mobile: normalizeMobile(mobile),
          email: email.trim() || null,
          programType,
          feeAmount: Number(feeAmount),
          notes: notes.trim() || null,
        }),
      });

      const json = (await res.json().catch(() => null)) as
        | { error?: string; fieldErrors?: FieldErrors; leadId?: string }
        | null;

      if (!res.ok || !json?.leadId) {
        setSubmitError(json?.error ?? "Could not create remedial admission.");
        setFieldErrors(json?.fieldErrors ?? {});
        return;
      }

      router.push(`/admin/leads/${json.leadId}`);
    });
  }

  return (
    <Card className="max-w-3xl p-6 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-700">
            Student Name
            <input
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
            {fieldErrors.studentName ? (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.studentName}</p>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Parent Name
            <input
              value={parentName}
              onChange={(event) => setParentName(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
            {fieldErrors.parentName ? (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.parentName}</p>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Mobile Number
            <input
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              inputMode="numeric"
              maxLength={10}
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
            {fieldErrors.mobile ? (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.mobile}</p>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
            {fieldErrors.email ? (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Program Type
            <select
              value={programType}
              onChange={(event) =>
                setProgramType(
                  event.target.value === "remedial_25" ? "remedial_25" : "remedial_12",
                )
              }
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
            >
              <option value="remedial_12">12-Day Remedial Program</option>
              <option value="remedial_25">25-Day Remedial Program</option>
            </select>
            {fieldErrors.programType ? (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.programType}</p>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Fee Amount in Rupees
            <input
              value={feeAmount}
              onChange={(event) => setFeeAmount(event.target.value)}
              type="number"
              min="1"
              step="1"
              className="mt-2 min-h-11 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
            />
            {fieldErrors.feeAmount ? (
              <p className="mt-2 text-sm text-red-600">{fieldErrors.feeAmount}</p>
            ) : null}
          </label>
        </div>

        <label className="block text-sm font-medium text-neutral-700">
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={5}
            className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-primary"
          />
          {fieldErrors.notes ? (
            <p className="mt-2 text-sm text-red-600">{fieldErrors.notes}</p>
          ) : null}
        </label>

        {submitError ? (
          <p className="text-sm font-medium text-red-600">{submitError}</p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="min-h-11 sm:w-auto" disabled={isPending}>
            {isPending ? "Creating..." : "Create Admission"}
          </Button>
          <Button href="/admin/leads" variant="outline" className="min-h-11 sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
