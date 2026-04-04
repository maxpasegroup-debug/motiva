"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n";
import { clearSession, getAuthToken } from "@/lib/session";

const MENU: {
  href: string;
  emoji: string;
  labelKey: TranslationKey;
}[] = [
  { href: "/dashboard/join", emoji: "🎥", labelKey: "join_class" },
  { href: "/dashboard/lessons", emoji: "📚", labelKey: "my_courses" },
];

type DashboardCourseRow = {
  course_id: string;
  title: string;
  thumbnail_path: string | null;
  total_lessons: number;
  completed_lessons: number;
  current_lesson_number: number;
};

export function DashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [courses, setCourses] = useState<DashboardCourseRow[] | null>(null);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setCourses([]);
      return;
    }
    setCoursesError(null);
    try {
      const res = await fetch("/api/progress", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        courses?: DashboardCourseRow[];
        error?: string;
      };
      if (!res.ok) {
        setCoursesError(
          json.error ?? t("course_dashboard_load_error"),
        );
        setCourses([]);
        return;
      }
      if (json.success && Array.isArray(json.courses)) {
        setCourses(json.courses);
      } else {
        setCourses([]);
      }
    } catch {
      setCoursesError(t("course_dashboard_load_error"));
      setCourses([]);
    }
  }, [t]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  function handleLogOut() {
    clearSession();
    router.push("/");
  }

  function progressLabel(row: DashboardCourseRow): string {
    if (row.total_lessons === 0) return t("course_dashboard_no_lessons");
    if (row.current_lesson_number === 0) return t("course_dashboard_not_started");
    return t("course_dashboard_lesson_progress")
      .replace("{n}", String(row.current_lesson_number))
      .replace("{total}", String(row.total_lessons));
  }

  function progressPercent(row: DashboardCourseRow): number {
    if (row.total_lessons === 0) return 0;
    return Math.min(
      100,
      Math.round((row.completed_lessons / row.total_lessons) * 100),
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
        {t("dashboard_title")}
      </h1>

      <section className="space-y-4" aria-labelledby="online-courses-heading">
        <h2
          id="online-courses-heading"
          className="text-lg font-semibold text-foreground"
        >
          {t("course_dashboard_online_heading")}
        </h2>
        {coursesError ? (
          <p className="text-sm text-accent">{coursesError}</p>
        ) : null}
        {courses === null ? (
          <p className="text-sm text-neutral-500">{t("course_player_loading")}</p>
        ) : courses.length === 0 ? (
          <Card className="p-6 text-center text-neutral-600 shadow-md">
            {t("course_dashboard_empty")}
          </Card>
        ) : (
          <ul className="space-y-4">
            {courses.map((row) => (
              <li key={row.course_id}>
                <Card className="overflow-hidden shadow-md">
                  {row.thumbnail_path?.startsWith("http") ||
                  row.thumbnail_path?.startsWith("data:") ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin may store data URLs
                    <img
                      src={row.thumbnail_path}
                      alt=""
                      className="h-36 w-full object-cover"
                    />
                  ) : null}
                  <div className="space-y-3 p-6">
                    <p className="text-lg font-bold text-foreground">
                      {row.title}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {progressLabel(row)}
                    </p>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-[width] duration-300"
                        style={{ width: `${progressPercent(row)}%` }}
                      />
                    </div>
                    <Button
                      href={`/course/${row.course_id}`}
                      className="min-h-12 w-full sm:w-auto"
                    >
                      {t("course_dashboard_continue_learning")}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
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
