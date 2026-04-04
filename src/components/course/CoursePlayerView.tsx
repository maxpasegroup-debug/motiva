"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { getAuthToken, getSession } from "@/lib/session";

export type CourseLessonApi = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  order: number;
};

type CoursePayload = {
  title: string;
  description: string | null;
  thumbnail_path: string | null;
  lessons: CourseLessonApi[];
};

type ProgressSnap = {
  lessonId: string | null;
  furthest: number;
  completedLessons: number;
};

type Props = {
  courseId: string;
};

export function CoursePlayerView({ courseId }: Props) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [data, setData] = useState<CoursePayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressSnap, setProgressSnap] = useState<ProgressSnap | null>(null);
  const [batchCurrentDay, setBatchCurrentDay] = useState<number | null>(null);
  const [currentLesson, setCurrentLesson] = useState<CourseLessonApi | null>(
    null,
  );

  const session = getSession();
  const canTrack = session?.role === "student" && !!getAuthToken();

  /** Guest / preview: `?day=` caps unlock; omit = all unlocked. */
  const guestDayCap = useMemo(() => {
    const raw = searchParams.get("day");
    if (raw === null || raw === "") return Number.POSITIVE_INFINITY;
    const n = Number(raw);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  }, [searchParams]);

  const autoplay = searchParams.get("autoplay") === "1";

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const token = getAuthToken();
      const headers: HeadersInit = {};
      if (canTrack && token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`/api/courses/${courseId}`, { headers });
      const json = (await res.json().catch(() => ({}))) as
        | CoursePayload
        | { error?: string };
      if (res.status === 403) {
        setLoadError(t("course_no_access"));
        setData(null);
        return;
      }
      if (!res.ok) {
        setLoadError(
          "error" in json && json.error
            ? json.error
            : t("course_player_load_error"),
        );
        setData(null);
        return;
      }
      setData(json as CoursePayload);
    } catch {
      setLoadError(t("course_player_load_error"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [courseId, t, canTrack]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    if (!canTrack) {
      setProgressSnap(null);
      setBatchCurrentDay(null);
      setProgressLoading(false);
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setProgressSnap(null);
      setBatchCurrentDay(null);
      setProgressLoading(false);
      return;
    }
    setProgressLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/progress?course_id=${encodeURIComponent(courseId)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          furthest_completed_order?: number;
          lesson_id?: string | null;
          completed_lessons?: number;
          batch_current_day?: number | null;
        };
        if (res.ok && json.success) {
          const furthest = json.furthest_completed_order ?? -1;
          const completedLessons = json.completed_lessons ?? 0;
          setProgressSnap({
            lessonId: json.lesson_id ?? null,
            furthest,
            completedLessons,
          });
          setBatchCurrentDay(
            typeof json.batch_current_day === "number"
              ? json.batch_current_day
              : null,
          );
        } else {
          setProgressSnap({ lessonId: null, furthest: -1, completedLessons: 0 });
          setBatchCurrentDay(null);
        }
      } catch {
        setProgressSnap({ lessonId: null, furthest: -1, completedLessons: 0 });
        setBatchCurrentDay(null);
      } finally {
        setProgressLoading(false);
      }
    })();
  }, [canTrack, courseId]);

  const isUnlocked = useCallback(
    (lesson: CourseLessonApi) => {
      if (canTrack) {
        if (batchCurrentDay !== null) {
          return lesson.order + 1 <= batchCurrentDay;
        }
        if (progressSnap !== null) {
          return lesson.order <= progressSnap.furthest + 1;
        }
        return false;
      }
      return lesson.order <= guestDayCap;
    },
    [canTrack, batchCurrentDay, progressSnap, guestDayCap],
  );

  useEffect(() => {
    if (!data?.lessons?.length) {
      setCurrentLesson(null);
      return;
    }
    const lessons = data.lessons;

    const unlocked = (l: CourseLessonApi) => {
      if (canTrack) {
        if (batchCurrentDay !== null) {
          return l.order + 1 <= batchCurrentDay;
        }
        if (progressSnap !== null) {
          return l.order <= progressSnap.furthest + 1;
        }
        return false;
      }
      return l.order <= guestDayCap;
    };

    if (canTrack && (progressSnap !== null || batchCurrentDay !== null)) {
      if (progressSnap?.lessonId) {
        const resume = lessons.find((l) => l.id === progressSnap.lessonId);
        if (resume && unlocked(resume)) {
          setCurrentLesson(resume);
          return;
        }
      }
      const firstOk = lessons.find((l) => unlocked(l));
      setCurrentLesson(firstOk ?? lessons[0] ?? null);
      return;
    }

    setCurrentLesson((prev) => {
      if (prev) {
        const still = lessons.find((l) => l.id === prev.id);
        if (still && unlocked(still)) return still;
      }
      const firstUnlocked = lessons.find((l) => unlocked(l));
      return firstUnlocked ?? lessons[0] ?? null;
    });
  }, [data, canTrack, progressSnap, guestDayCap, batchCurrentDay]);

  const saveProgress = useCallback(
    async (lesson: CourseLessonApi, completed: boolean) => {
      if (!canTrack) return;
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            course_id: courseId,
            lesson_id: lesson.id,
            completed,
          }),
        });
        if (!res.ok) return;
        setProgressSnap((prev) => {
          const base = prev ?? { lessonId: null, furthest: -1, completedLessons: 0 };
          const nextFurthest = completed
            ? Math.max(base.furthest, lesson.order)
            : base.furthest;
          const total = data?.lessons.length ?? 0;
          return {
            lessonId: lesson.id,
            furthest: nextFurthest,
            completedLessons: Math.min(total, Math.max(0, nextFurthest + 1)),
          };
        });
      } catch {
        /* ignore */
      }
    },
    [canTrack, courseId, data?.lessons.length],
  );

  const sortedLessons = useMemo(() => {
    if (!data?.lessons.length) return [];
    return [...data.lessons].sort((a, b) => a.order - b.order);
  }, [data?.lessons]);

  const nextLesson = useMemo(() => {
    if (!currentLesson || !sortedLessons.length) return null;
    const i = sortedLessons.findIndex((l) => l.id === currentLesson.id);
    if (i < 0) return null;
    return sortedLessons.slice(i + 1).find((l) => isUnlocked(l)) ?? null;
  }, [currentLesson, sortedLessons, isUnlocked]);

  const progressPercent = useMemo(() => {
    const total = data?.lessons.length ?? 0;
    if (total === 0) return 0;
    const done = canTrack
      ? progressSnap?.completedLessons ?? 0
      : 0;
    return Math.min(100, Math.round((done / total) * 100));
  }, [data?.lessons.length, canTrack, progressSnap?.completedLessons]);

  const showLoading = loading || (canTrack && progressLoading);

  if (showLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-neutral-500">
        {t("course_player_loading")}
      </div>
    );
  }

  if (loadError || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-accent">
        {loadError ?? t("course_not_found")}
      </div>
    );
  }

  const { title, description, thumbnail_path, lessons } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground transition-opacity duration-300 sm:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mb-6 max-w-3xl text-neutral-600">{description}</p>
      ) : null}

      {canTrack && lessons.length > 0 ? (
        <div className="mb-8">
          <div className="mb-2 h-2 w-full max-w-xl overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-2 rounded-full bg-blue-500 transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="order-1 space-y-4 lg:order-none lg:col-span-2">
          {currentLesson && isUnlocked(currentLesson) ? (
            <div className="transition-all duration-300 ease-out">
              <video
                key={currentLesson.id}
                src={currentLesson.video_url}
                controls
                className="w-full rounded-xl shadow-lg transition-shadow duration-300 ease-out hover:shadow-xl"
                poster={thumbnail_path ?? undefined}
                autoPlay={autoplay}
                preload="metadata"
                onPlay={() => void saveProgress(currentLesson, false)}
                onEnded={() => void saveProgress(currentLesson, true)}
              />
              {nextLesson ? (
                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setCurrentLesson(nextLesson);
                      void saveProgress(nextLesson, false);
                    }}
                  >
                    {t("course_player_next_lesson")}
                  </Button>
                </div>
              ) : null}
              {currentLesson.description ? (
                <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700 transition-opacity duration-300">
                  {currentLesson.description}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50/80 px-6 py-16 text-center text-neutral-500 transition-colors duration-300">
              {t("course_player_select_lesson")}
            </div>
          )}
        </div>

        <aside className="order-2 lg:order-none lg:col-span-1">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {t("course_player_lessons_heading")}
          </h2>
          <nav
            className="max-h-[80vh] space-y-2 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-sm"
            aria-label={t("course_player_lessons_heading")}
          >
            {lessons.map((lesson, index) => {
              const unlocked = isUnlocked(lesson);
              const active = currentLesson?.id === lesson.id;
              return (
                <div
                  key={lesson.id}
                  role="button"
                  tabIndex={unlocked ? 0 : -1}
                  onClick={() => {
                    if (!unlocked) return;
                    setCurrentLesson(lesson);
                    if (canTrack) void saveProgress(lesson, false);
                  }}
                  onKeyDown={(e) => {
                    if (!unlocked) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCurrentLesson(lesson);
                      if (canTrack) void saveProgress(lesson, false);
                    }
                  }}
                  className={`rounded-lg p-4 transition-all duration-200 ease-out ${
                    unlocked
                      ? "cursor-pointer hover:scale-[1.02] hover:bg-neutral-100 hover:shadow-md"
                      : "cursor-not-allowed opacity-60"
                  } ${
                    active && unlocked
                      ? "border-l-4 border-blue-500 bg-blue-100 shadow-sm"
                      : "border-l-4 border-transparent"
                  } `}
                >
                  <p className="text-sm text-gray-500">
                    {t("course_player_lesson_label")} {index + 1}
                  </p>
                  <div className="mt-1 flex items-start gap-2">
                    <span className="text-lg" aria-hidden>
                      {unlocked ? "▶" : "🔒"}
                    </span>
                    <h4 className="font-semibold text-foreground">
                      {lesson.title}
                    </h4>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}
