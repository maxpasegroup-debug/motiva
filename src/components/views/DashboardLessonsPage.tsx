"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getAuthToken } from "@/lib/session";

type EnrollmentJson = {
  success?: boolean;
  enrolled?: boolean;
  batch?: {
    id: string;
    name: string;
    duration: number;
  };
  course?: {
    id: string;
    title: string;
    is_published: boolean;
    total_lessons: number;
  } | null;
};

export function DashboardLessonsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<EnrollmentJson | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setData({ success: true, enrolled: false });
      return;
    }
    setError(null);
    try {
      const res = await fetch("/api/student/enrollment", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as EnrollmentJson & {
        error?: string;
      };
      if (!res.ok) {
        setError(json.error ?? t("course_dashboard_load_error"));
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError(t("course_dashboard_load_error"));
      setData(null);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← {t("back")}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
          {t("my_courses")}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">{t("lessons_description")}</p>
      </div>

      {error ? (
        <p className="text-sm text-accent">{error}</p>
      ) : null}

      {data === null ? (
        <Card className="p-8 text-center shadow-md">
          <p className="text-neutral-600">{t("course_player_loading")}</p>
        </Card>
      ) : !data.enrolled || !data.batch ? (
        <Card className="p-8 text-center shadow-md">
          <p className="text-neutral-600">{t("lessons_empty")}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t("course_dashboard_empty")}
          </p>
        </Card>
      ) : (
        <Card className="p-6 shadow-md">
          <p className="text-lg font-bold text-foreground">{data.batch.name}</p>
          {data.course ? (
            <p className="mt-2 text-neutral-600">{data.course.title}</p>
          ) : null}
          <p className="mt-2 text-sm text-neutral-500">
            {data.batch.duration} {t("admin_classes_days_short")}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              href={`/dashboard/class/${data.batch.id}`}
              className="min-h-14 w-full"
            >
              {t("class_tap_progress")}
            </Button>
            {data.course?.is_published ? (
              <Button
                href={`/course/${data.course.id}`}
                variant="outline"
                className="min-h-14 w-full"
              >
                {t("course_dashboard_continue_learning")}
              </Button>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  );
}
