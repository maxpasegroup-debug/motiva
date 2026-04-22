"use client";

import { useMemo, useState } from "react";

type Lesson = {
  id: string;
  type: string;
  sectionTitle: string;
  videoTitle: string;
  videoUrl: string;
  description: string;
};

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtu.be") {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function DashboardCoursePlayer({
  courseId,
  courseTitle,
  initialProgress,
  lessons,
}: {
  courseId: string;
  courseTitle: string;
  initialProgress: number;
  lessons: Lesson[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(
    Math.max(0, Math.min(100, Math.round(initialProgress))),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeLesson = lessons[activeIndex] ?? null;

  const completedCount = useMemo(() => {
    if (lessons.length === 0) return 0;
    return Math.floor((progress / 100) * lessons.length);
  }, [lessons.length, progress]);

  async function markComplete() {
    if (!activeLesson || lessons.length === 0) return;
    setError(null);
    const nextCount = Math.max(completedCount, activeIndex + 1);
    const nextProgress = Math.min(
      100,
      Math.round((nextCount / lessons.length) * 100),
    );

    setSaving(true);
    const res = await fetch(`/api/courses/${courseId}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress: nextProgress }),
    });

    if (!res.ok) {
      setError("Could not update progress");
      setSaving(false);
      return;
    }

    setProgress(nextProgress);
    setSaving(false);
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          {courseTitle}
        </h1>
        <p className="text-sm font-medium text-neutral-700">Progress: {progress}%</p>
      </div>

      <div className="mb-5 h-2 w-full rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <aside className="w-full shrink-0 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm md:w-[280px]">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Lessons
          </h2>
          <ul className="space-y-2">
            {lessons.map((lesson, i) => {
              const isActive = i === activeIndex;
              const isCompleted = i < completedCount;
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <p className="text-xs text-neutral-500">
                      {lesson.type === "intro" ? "Introduction" : `Lesson ${i + 1}`}
                    </p>
                    <p className="text-sm font-semibold text-neutral-900">
                      {lesson.sectionTitle}
                    </p>
                    <p className="text-xs text-neutral-700">
                      {isCompleted ? "✅ " : ""}
                      {lesson.videoTitle}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          {activeLesson ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-neutral-900">
                {activeLesson.videoTitle}
              </h2>

              {getEmbedUrl(activeLesson.videoUrl) ? (
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-neutral-200">
                  <iframe
                    src={getEmbedUrl(activeLesson.videoUrl) || ""}
                    title={activeLesson.videoTitle}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Invalid or unsupported video URL.
                </div>
              )}

              <p className="text-sm leading-relaxed text-neutral-700">
                {activeLesson.description}
              </p>

              <button
                type="button"
                onClick={markComplete}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
              >
                {saving ? "Saving..." : "Mark lesson complete"}
              </button>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          ) : (
            <p className="text-sm text-neutral-600">No lesson available.</p>
          )}
        </section>
      </div>
    </main>
  );
}
