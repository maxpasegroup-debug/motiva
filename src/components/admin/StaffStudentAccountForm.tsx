"use client";

import { useState, useTransition } from "react";
import { SecretInput } from "@/components/auth/SecretInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

function digits10(raw: string) {
  return raw.replace(/\D/g, "").slice(-10);
}

function randomPin() {
  return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
}

export function StaffStudentAccountForm() {
  const [studentName, setStudentName] = useState("");
  const [studentMobile, setStudentMobile] = useState("");
  const [studentPin, setStudentPin] = useState(randomPin);
  const [parentName, setParentName] = useState("");
  const [parentMobile, setParentMobile] = useState("");
  const [parentPin, setParentPin] = useState(randomPin);
  const [email, setEmail] = useState("");
  const [programType, setProgramType] = useState("tuition");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    studentAccountId: string;
    credentials: {
      student: { mobile: string; pin: string };
      parent: { mobile: string; pin: string };
    };
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setStudentName("");
    setStudentMobile("");
    setStudentPin(randomPin());
    setParentName("");
    setParentMobile("");
    setParentPin(randomPin());
    setEmail("");
    setProgramType("tuition");
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
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
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: studentName.trim(),
          mobile,
          studentPin,
          parentName: parentName.trim(),
          parentMobile: pMobile,
          parentPin,
          email: email.trim(),
          programType: programType.trim() || "tuition",
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
        setSubmitError(json?.error ?? "Could not create student.");
        return;
      }

      setCreated({
        studentAccountId: json.studentAccountId,
        credentials: json.credentials,
      });
      resetForm();
    });
  }

  return (
    <Card className="max-w-4xl p-6 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-8">
        <section className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-700">
            Student Name
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Student Mobile
            <input
              value={studentMobile}
              onChange={(e) => setStudentMobile(e.target.value)}
              inputMode="numeric"
              className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Student PIN
            <SecretInput
              value={studentPin}
              onChange={(e) => setStudentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4"
            />
          </label>
          <Button type="button" variant="outline" onClick={() => setStudentPin(randomPin())}>
            Generate Student PIN
          </Button>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-700">
            Parent Name
            <input
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Parent Mobile
            <input
              value={parentMobile}
              onChange={(e) => setParentMobile(e.target.value)}
              inputMode="numeric"
              className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Parent PIN
            <SecretInput
              value={parentPin}
              onChange={(e) => setParentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4"
            />
          </label>
          <Button type="button" variant="outline" onClick={() => setParentPin(randomPin())}>
            Generate Parent PIN
          </Button>
        </section>

        <section className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-700">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4"
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            Program Type
            <select
              value={programType}
              onChange={(e) => setProgramType(e.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-neutral-300 px-4"
            >
              <option value="tuition">Tuition</option>
              <option value="remedial_12">12-Day Remedial</option>
              <option value="remedial_25">25-Day Remedial</option>
              <option value="course">Recorded Course</option>
            </select>
          </label>
        </section>

        {submitError ? <p className="text-sm font-medium text-red-600">{submitError}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="min-h-11 sm:w-auto" disabled={isPending}>
            {isPending ? "Creating..." : "Create Student"}
          </Button>
          <Button href="/admin/students" variant="outline" className="min-h-11 sm:w-auto">
            View Students
          </Button>
        </div>
      </form>

      {created ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-neutral-900">Student Created</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Save these credentials now. PINs cannot be retrieved later.
            </p>
            <div className="mt-4 space-y-3 rounded-lg bg-neutral-50 p-4 text-sm">
              <p>
                <span className="font-semibold">Student:</span>{" "}
                {created.credentials.student.mobile} / {created.credentials.student.pin}
              </p>
              <p>
                <span className="font-semibold">Parent:</span>{" "}
                {created.credentials.parent.mobile} / {created.credentials.parent.pin}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreated(null)}
              className="mt-5 min-h-11 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
