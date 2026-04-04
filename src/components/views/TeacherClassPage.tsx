"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAuthToken } from "@/lib/session";

type Props = { classId: string };

type BatchPayload = {
  id: string;
  name: string;
  course_id: string;
  teacher_id: string;
  duration: 12 | 25;
};

type CoursePayload = {
  id: string;
  title: string;
  is_published: boolean;
};

type StudentRow = {
  id: string;
  name: string;
  email: string;
  progress: {
    lesson_id: string;
    furthest_completed_order: number;
    last_watched_at: string;
  } | null;
};

export function TeacherClassPage({ classId }: Props) {
  const { t } = useLanguage();
  const [batch, setBatch] = useState<BatchPayload | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [course, setCourse] = useState<CoursePayload | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [lessons, setLessons] = useState<{ id: string; title: string; order: number }[]>(
    [],
  );
  const [presentSet, setPresentSet] = useState<Set<string>>(() => new Set());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nextBusy, setNextBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoadError("Unauthorized");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/teacher/batches/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        batch?: BatchPayload;
        current_day?: number;
        attendance_for_day?: Record<string, "present" | "absent">;
        course?: CoursePayload | null;
        students?: StudentRow[];
        lessons?: { id: string; title: string; order: number }[];
        error?: string;
      };
      if (!res.ok) {
        setBatch(null);
        setLoadError(json.error ?? t("class_not_found"));
        return;
      }
      if (json.batch) setBatch(json.batch);
      const cd = json.current_day ?? 1;
      setCurrentDay(cd);
      const nextPresent = new Set<string>();
      const att = json.attendance_for_day ?? {};
      for (const s of json.students ?? []) {
        if (att[s.id] === "present") nextPresent.add(s.id);
      }
      setPresentSet(nextPresent);
      setCourse(json.course ?? null);
      setStudents(json.students ?? []);
      setLessons(json.lessons ?? []);
    } catch {
      setLoadError(t("class_not_found"));
      setBatch(null);
    } finally {
      setLoading(false);
    }
  }, [classId, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function markAllPresent() {
    setPresentSet(new Set(students.map((s) => s.id)));
  }

  async function saveAttendance() {
    const token = getAuthToken();
    if (!token || !batch) return;
    setSaving(true);
    setToast(null);
    try {
      const entries = students.map((s) => ({
        student_id: s.id,
        status: presentSet.has(s.id) ? ("present" as const) : ("absent" as const),
      }));
      const res = await fetch(`/api/teacher/batches/${classId}/attendance`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entries }),
      });
      if (res.ok) {
        setToast(t("attendance_saved"));
      }
    } finally {
      setSaving(false);
    }
  }

  async function nextDay() {
    const token = getAuthToken();
    if (!token) return;
    setNextBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/teacher/batches/${classId}/next-day`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const json = (await res.json().catch(() => ({}))) as {
        current_day?: number;
        day_completed_message?: string | null;
        at_end?: boolean;
      };
      if (res.ok) {
        if (typeof json.current_day === "number") {
          setCurrentDay(json.current_day);
        }
        if (json.day_completed_message) {
          setToast(json.day_completed_message);
        } else if (json.at_end) {
          setToast(t("attendance_batch_at_end"));
        }
        await refresh();
      }
    } finally {
      setNextBusy(false);
    }
  }

  function toggleStudent(id: string) {
    setPresentSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-neutral-400" aria-busy="true">
        …
      </div>
    );
  }

  if (loadError || !batch) {
    return (
      <Card className="p-8 text-center shadow-md">
        <p className="text-neutral-600">{loadError ?? t("class_not_found")}</p>
        <Link
          href="/teacher"
          className="mt-4 inline-block font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← {t("back")}
        </Link>
      </Card>
    );
  }

  const atLastDay = currentDay >= batch.duration;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href="/teacher"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← {t("class_back_teacher")}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
          {batch.name}
        </h1>
        <p className="mt-3 text-xl font-semibold text-primary">
          {t("attendance_day_heading").replace("{n}", String(currentDay))}
        </p>
        {course ? (
          <p className="mt-1 text-neutral-600">
            {course.title} · {batch.duration} {t("admin_classes_days_short")}
          </p>
        ) : null}
        {course?.is_published ? (
          <Link
            href={`/course/${course.id}`}
            className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t("teacher_view_course_lessons")}
          </Link>
        ) : null}
      </div>

      {toast ? (
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-center text-sm font-medium text-primary">
          {toast}
        </p>
      ) : null}

      <Card className="p-6 shadow-lg sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-800">
          {t("attendance_mark_title")}
        </h2>
        {students.length === 0 ? (
          <p className="text-sm text-neutral-500">{t("teacher_no_students_in_batches")}</p>
        ) : (
          <ul className="space-y-3">
            {students.map((s) => {
              const checked = presentSet.has(s.id);
              return (
                <li key={s.id}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-4 rounded-xl border border-neutral-200 px-4 py-3 hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStudent(s.id)}
                      className="h-5 w-5 rounded border-neutral-300 text-primary"
                    />
                    <span className="text-base font-medium text-foreground">
                      {checked ? "✔ " : "○ "}
                      {s.name}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={markAllPresent}
            disabled={students.length === 0}
            className="min-h-14 flex-1"
          >
            {t("attendance_mark_all_present")}
          </Button>
          <Button
            type="button"
            onClick={() => void saveAttendance()}
            disabled={students.length === 0 || saving}
            className="min-h-14 flex-1"
          >
            {saving ? "…" : t("attendance_save")}
          </Button>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          onClick={() => void nextDay()}
          disabled={nextBusy || atLastDay}
          className="min-h-16 text-lg"
        >
          {nextBusy ? "…" : t("attendance_next_day")}
        </Button>
        {atLastDay ? (
          <p className="text-center text-sm text-neutral-500">
            {t("attendance_batch_at_end")}
          </p>
        ) : null}
      </div>

      {lessons.length > 0 ? (
        <Card className="p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-neutral-800">
            {t("course_player_lessons_heading")}
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-700">
            {lessons.map((l) => (
              <li key={l.id}>
                {l.title}{" "}
                <span className="text-neutral-400">
                  ({t("course_player_lesson_label")} {l.order + 1})
                </span>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <Card className="p-6 shadow-md">
        <h2 className="mb-4 text-lg font-semibold text-neutral-800">
          {t("teacher_batch_students_progress")}
        </h2>
        {students.length === 0 ? (
          <p className="text-sm text-neutral-500">
            {t("teacher_no_students_in_batches")}
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {students.map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-neutral-200 bg-neutral-50/80 px-4 py-3"
              >
                <p className="font-semibold text-foreground">{s.name}</p>
                <p className="text-xs text-neutral-500">{s.email}</p>
                <p className="mt-2 text-neutral-600">
                  {s.progress &&
                  s.progress.furthest_completed_order >= 0
                    ? t("teacher_progress_furthest_lesson_order").replace(
                        "{n}",
                        String(s.progress.furthest_completed_order + 1),
                      )
                    : t("teacher_progress_none")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
