"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  addCourse,
  addLesson,
  listCourses,
  unlockNextLesson,
  type CourseRecord,
} from "@/lib/courses-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function AdminCoursesPage() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [courseName, setCourseName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonUrl, setLessonUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const list = listCourses();
    setCourses(list);
    setSelectedId((id) =>
      id && list.some((c) => c.id === id) ? id : "",
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selected = courses.find((c) => c.id === selectedId) ?? null;

  function handleAddCourse(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const n = courseName.trim();
    if (!n) {
      setError(t("admin_course_name_required"));
      return;
    }
    const created = addCourse(n);
    setCourseName("");
    refresh();
    setSelectedId(created.id);
  }

  function handleAddLesson(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedId) {
      setError(t("admin_course_pick_first"));
      return;
    }
    const title = lessonTitle.trim();
    const url = lessonUrl.trim();
    if (!title) {
      setError(t("admin_lesson_title_required"));
      return;
    }
    if (!url) {
      setError(t("admin_lesson_url_required"));
      return;
    }
    addLesson(selectedId, title, url);
    setLessonTitle("");
    setLessonUrl("");
    refresh();
  }

  function handleUnlockNext() {
    if (!selectedId) return;
    unlockNextLesson(selectedId);
    refresh();
  }

  const canUnlock =
    selected &&
    selected.lessons.length > 0 &&
    selected.unlockedThroughLesson < selected.lessons.length;

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {t("admin_nav_courses")}
      </h1>

      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="p-6 shadow-md sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("admin_course_add_heading")}
        </h2>
        <form
          onSubmit={handleAddCourse}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <label className="block flex-1 text-left text-sm font-medium text-neutral-700">
            <span className="mb-2 block">{t("admin_course_name_label")}</span>
            <input
              type="text"
              value={courseName}
              onChange={(e) => {
                setCourseName(e.target.value);
                if (error) setError(null);
              }}
              className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
            />
          </label>
          <Button type="submit" className="min-h-14 shrink-0 sm:min-w-[10rem]">
            {t("admin_add_course")}
          </Button>
        </form>
      </Card>

      <Card className="p-6 shadow-md sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          {t("admin_lesson_add_heading")}
        </h2>
        <div className="mb-4">
          <label className="block text-left text-sm font-medium text-neutral-700">
            <span className="mb-2 block">{t("admin_select_course")}</span>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setError(null);
              }}
              className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
            >
              <option value="">{t("admin_course_select_placeholder")}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedId ? (
          <form onSubmit={handleAddLesson} className="flex flex-col gap-4">
            <label className="block text-left text-sm font-medium text-neutral-700">
              <span className="mb-2 block">{t("admin_lesson_title_label")}</span>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => {
                  setLessonTitle(e.target.value);
                  if (error) setError(null);
                }}
                className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
              />
            </label>
            <label className="block text-left text-sm font-medium text-neutral-700">
              <span className="mb-2 block">{t("admin_lesson_url_label")}</span>
              <input
                type="url"
                placeholder="https://..."
                value={lessonUrl}
                onChange={(e) => {
                  setLessonUrl(e.target.value);
                  if (error) setError(null);
                }}
                className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
              />
            </label>
            <Button type="submit" className="min-h-14">
              {t("admin_add_lesson")}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-neutral-500">{t("admin_course_pick_first")}</p>
        )}
      </Card>

      {selected && selected.lessons.length > 0 ? (
        <Card className="p-6 shadow-md sm:p-8">
          <h2 className="mb-6 text-lg font-semibold text-foreground">
            {selected.name}
          </h2>
          <ul className="space-y-3">
            {selected.lessons.map((lesson, index) => {
              const n = index + 1;
              const open = n <= selected.unlockedThroughLesson;
              return (
                <li key={lesson.id}>
                  <div className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 sm:px-5">
                    <span className="min-w-0 font-medium text-foreground">
                      {t("admin_lesson_prefix")} {n}: {lesson.title}
                    </span>
                    {open ? (
                      <a
                        href={lesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg p-2 text-2xl text-primary transition-colors hover:bg-primary/10"
                        title={t("admin_open_video")}
                        aria-label={t("admin_open_video")}
                      >
                        ▶
                      </a>
                    ) : (
                      <span className="shrink-0 text-2xl" aria-hidden>
                        🔒
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-8">
            <Button
              type="button"
              onClick={handleUnlockNext}
              disabled={!canUnlock}
              variant="outline"
              className="min-h-14 w-full"
            >
              {!canUnlock && selected
                ? t("admin_all_lessons_unlocked")
                : t("admin_unlock_next_lesson")}
            </Button>
          </div>
        </Card>
      ) : selected && selected.lessons.length === 0 ? (
        <Card className="p-8 text-center text-neutral-500 shadow-md">
          {t("admin_course_no_lessons_yet")}
        </Card>
      ) : null}

      {courses.length === 0 ? (
        <Card className="border-2 border-dashed border-neutral-200 p-8 text-center text-neutral-500 shadow-none">
          {t("admin_no_courses")}
        </Card>
      ) : null}
    </div>
  );
}
