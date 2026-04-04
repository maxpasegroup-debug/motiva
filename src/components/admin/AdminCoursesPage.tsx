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
  const [createOpen, setCreateOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalThumbnail, setModalThumbnail] = useState("");
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

  function closeCreateModal() {
    setCreateOpen(false);
    setModalName("");
    setModalDescription("");
    setModalThumbnail("");
  }

  function handleCreateCourse(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const n = modalName.trim();
    if (!n) {
      setError(t("admin_course_name_required"));
      return;
    }
    const created = addCourse(n, {
      description: modalDescription.trim() || undefined,
      thumbnailUrl: modalThumbnail.trim() || undefined,
    });
    closeCreateModal();
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

  function lessonsBlurb(count: number) {
    return t("admin_course_lessons_blurb").replace("{{n}}", String(count));
  }

  return (
    <div className="space-y-10">
      {error && !createOpen ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("admin_nav_courses")}
          </h1>
          <p className="mt-1 text-neutral-600">{t("admin_courses_sub")}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setCreateOpen(true);
          }}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-white"
        >
          {t("admin_courses_create")}
        </button>
      </div>

      {courses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white py-12 text-center text-neutral-500">
          {t("admin_courses_empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const initial = c.name.trim().slice(0, 1).toUpperCase() || "?";
            const desc =
              c.description?.trim() || lessonsBlurb(c.lessons.length);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedId(c.id);
                  setError(null);
                }}
                className={`group w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selectedId === c.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="aspect-video w-full overflow-hidden bg-neutral-100">
                  {c.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin-provided arbitrary URLs
                    <img
                      src={c.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-700 text-4xl font-bold text-white">
                      {initial}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-foreground">{c.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">
                    {desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {createOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 shadow-2xl sm:p-8">
            <h2 className="text-xl font-bold text-foreground">
              {t("admin_course_add_heading")}
            </h2>
            <form onSubmit={handleCreateCourse} className="mt-6 space-y-4">
              {error ? (
                <p className="text-sm text-accent" role="alert">
                  {error}
                </p>
              ) : null}
              <label className="block text-left text-sm font-medium text-neutral-700">
                <span className="mb-2 block">{t("admin_course_name_label")}</span>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => {
                    setModalName(e.target.value);
                    if (error) setError(null);
                  }}
                  className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                />
              </label>
              <label className="block text-left text-sm font-medium text-neutral-700">
                <span className="mb-2 block">
                  {t("admin_course_description_label")}
                </span>
                <textarea
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                />
              </label>
              <label className="block text-left text-sm font-medium text-neutral-700">
                <span className="mb-2 block">
                  {t("admin_course_thumbnail_label")}
                </span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={modalThumbnail}
                  onChange={(e) => setModalThumbnail(e.target.value)}
                  className="min-h-14 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none ring-primary focus-visible:border-primary focus-visible:ring-2"
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" className="min-h-14 flex-1 text-lg">
                  {t("admin_add_course")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    closeCreateModal();
                  }}
                  className="min-h-14 flex-1 text-lg"
                >
                  {t("back")}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

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
    </div>
  );
}
