"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { clearSession, getAuthToken } from "@/lib/session";

const MENU: { href: string; emoji: string; labelKey: "join_class" }[] = [
  { href: "/student/join", emoji: "🎥", labelKey: "join_class" },
];

type EnrollmentBatch = {
  id: string;
  name: string;
  teacher_id: string;
  duration: number;
  current_day: number;
  unlocked_day: number;
  completed_days: number;
};

export function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [batch, setBatch] = useState<EnrollmentBatch | null | undefined>(
    undefined,
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadEnrollment = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setBatch(null);
      return;
    }
    setLoadError(null);
    try {
      const res = await fetch("/api/student/enrollment", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        enrolled?: boolean;
        batch?: EnrollmentBatch;
        error?: string;
      };
      if (!res.ok) {
        setLoadError(json.error ?? t("course_dashboard_load_error"));
        setBatch(null);
        return;
      }
      if (json.success && json.enrolled && json.batch) {
        setBatch(json.batch);
      } else {
        setBatch(null);
      }
    } catch {
      setLoadError(t("course_dashboard_load_error"));
      setBatch(null);
    }
  }, [t]);

  useEffect(() => {
    void loadEnrollment();
  }, [loadEnrollment]);

  function handleLogOut() {
    clearSession();
    router.push("/");
  }

  return (
    <div className="space-y-10">
      <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
        {t("dashboard_title")}
      </h1>

      <section className="space-y-4" aria-labelledby="batch-heading">
        <h2
          id="batch-heading"
          className="text-lg font-semibold text-foreground"
        >
          {t("student_batch_heading")}
        </h2>
        {loadError ? (
          <p className="text-sm text-accent">{loadError}</p>
        ) : null}
        {batch === undefined ? (
          <p className="text-sm text-neutral-500">{t("course_player_loading")}</p>
        ) : batch === null ? (
          <Card className="p-6 text-center text-neutral-600 shadow-md">
            {t("student_batch_empty")}
          </Card>
        ) : (
          <Card className="overflow-hidden p-6 shadow-md">
            <p className="text-lg font-bold text-foreground">{batch.name}</p>
            <p className="mt-2 text-sm text-neutral-600">
              {t("admin_batch_current_day")}:{" "}
              {t("attendance_day_heading").replace(
                "{n}",
                String(batch.current_day),
              )}
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {t("admin_classes_card_duration")}: {batch.duration}{" "}
              {t("admin_classes_days_short")}
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              {t("student_batch_completed_days")}: {batch.completed_days} /{" "}
              {batch.duration}
            </p>
          </Card>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {MENU.map(({ href, emoji, labelKey }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-md transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-[180px]"
          >
            <span className="text-5xl leading-none sm:text-6xl" aria-hidden>
              {emoji}
            </span>
            <span className="text-lg font-semibold text-foreground group-hover:text-primary sm:text-xl">
              {t(labelKey)}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 pt-4">
        <Button type="button" variant="outline" onClick={handleLogOut}>
          {t("log_out")}
        </Button>
        <Link
          href="/"
          className="text-sm font-medium text-neutral-500 underline-offset-4 hover:text-primary hover:underline"
        >
          ← {t("home")}
        </Link>
      </div>
    </div>
  );
}
