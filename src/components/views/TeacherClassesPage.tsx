"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getAuthToken } from "@/lib/session";
import { TeacherBackLink } from "@/components/views/TeacherSubPageLayout";

type ApiBatch = {
  id: string;
  name: string;
  course_id: string;
  teacher_id: string;
  duration: 12 | 25;
  student_count: number;
  course_title: string;
  completed_days: number;
  unlocked_day: number;
};

export function TeacherClassesPage() {
  const { t } = useLanguage();
  const [batches, setBatches] = useState<ApiBatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setBatches([]);
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/teacher/batches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        batches?: ApiBatch[];
      };
      if (!res.ok) {
        setBatches([]);
        setError(t("class_not_found"));
        return;
      }
      setBatches(json.batches ?? []);
    } catch {
      setBatches([]);
      setError(t("class_not_found"));
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-8">
      <TeacherBackLink />
      <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
        {t("teacher_nav_classes")}
      </h1>
      {error ? (
        <p className="text-center text-sm text-accent">{error}</p>
      ) : null}

      {batches.length === 0 ? (
        <Card className="p-8 text-center text-neutral-500 shadow-md">
          {t("class_teacher_no_batches")}
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {batches.map((c) => (
            <li key={c.id}>
              <Link
                href={`/teacher/class/${c.id}`}
                className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-md transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[180px]"
              >
                <span className="text-5xl leading-none sm:text-6xl" aria-hidden>
                  📅
                </span>
                <p className="text-lg font-bold text-foreground sm:text-xl">
                  {c.name}
                </p>
                <p className="text-sm text-neutral-600">
                  {c.course_title} · {c.student_count}{" "}
                  {t("admin_classes_card_students").toLowerCase()} ·{" "}
                  {c.completed_days}/{c.duration} {t("class_days_done_suffix")}
                </p>
                <p className="text-sm font-medium text-primary">
                  {t("class_tap_progress")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
