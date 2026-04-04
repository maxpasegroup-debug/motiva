"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Card } from "@/components/ui/Card";

type ProgramDetail = {
  id: string;
  title: string;
  description: string;
  image_path: string;
};

export function AdmissionPageContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const programId = searchParams.get("program");

  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );

  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!programId) {
      setProgram(null);
      setLoadState("idle");
      return;
    }
    let cancelled = false;
    setLoadState("loading");
    fetch(`/api/programs/${encodeURIComponent(programId)}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json() as Promise<{ program?: ProgramDetail }>;
      })
      .then((json) => {
        if (cancelled) return;
        const p = json.program;
        if (!p?.id) {
          setLoadState("error");
          setProgram(null);
          return;
        }
        setProgram(p);
        setLoadState("ok");
      })
      .catch(() => {
        if (!cancelled) {
          setLoadState("error");
          setProgram(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [programId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!program) return;
    if (!studentName.trim() || !parentName.trim() || !phone.trim()) {
      setFormError(t("admission_form_required"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: studentName.trim(),
          parent_name: parentName.trim(),
          phone: phone.trim(),
          program_id: program.id,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (res.status === 503) {
        setFormError(t("admission_db_not_configured"));
        return;
      }

      if (!res.ok) {
        setFormError(json.error ?? t("admission_form_submit_error"));
        return;
      }

      setSuccessMessage(
        typeof json.message === "string" ? json.message : null,
      );
      setSubmitted(true);
      setStudentName("");
      setParentName("");
      setPhone("");
    } catch {
      setFormError(t("admission_form_submit_error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!programId) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-foreground">
            {t("nav_admission")}
          </h1>
          <p className="mt-4 text-neutral-600">{t("admission_pick_program")}</p>
          <Link
            href="/#programs"
            className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-center font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {t("programs_title")}
          </Link>
        </Card>
      </div>
    );
  }

  if (loadState === "loading" || loadState === "idle") {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center text-neutral-500">
        {t("admission_program_loading")}
      </div>
    );
  }

  if (loadState === "error" || !program) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-foreground">
            {t("nav_admission")}
          </h1>
          <p className="mt-4 text-neutral-600">{t("admission_program_not_found")}</p>
          <Link
            href="/#programs"
            className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-blue-600 px-6 text-center font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {t("programs_title")}
          </Link>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold text-foreground">
            {successMessage ?? t("admission_form_success")}
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-blue-600 px-6 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {t("home")}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10 sm:py-14">
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-foreground">
          {t("nav_admission")}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">{program.title}</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-neutral-700">
              {t("admission_form_student_name")}
            </span>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
              autoComplete="name"
              className="min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg outline-none ring-blue-600/25 focus:border-blue-600 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-neutral-700">
              {t("admission_form_parent_name")}
            </span>
            <input
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              required
              autoComplete="name"
              className="min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg outline-none ring-blue-600/25 focus:border-blue-600 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-neutral-700">
              {t("admission_form_phone")}
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              inputMode="tel"
              className="min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg outline-none ring-blue-600/25 focus:border-blue-600 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-neutral-700">
              {t("admission_form_program")}
            </span>
            <input
              value={program.title}
              readOnly
              tabIndex={-1}
              className="min-h-14 w-full cursor-default rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-lg text-neutral-800"
            />
          </label>

          {formError ? (
            <p className="text-sm font-medium text-red-600">{formError}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 min-h-14 w-full rounded-xl bg-blue-600 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "…" : t("admission_form_submit")}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-500">
          <Link
            href="/#programs"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            ← {t("programs_title")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
