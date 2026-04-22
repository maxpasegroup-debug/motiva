"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n";
import { getAuthToken } from "@/lib/session";

type Video = {
  id: string;
  videoTitle: string;
  videoUrl: string;
  description: string;
  order: number;
};

type Section = {
  id: string;
  type: string;
  sectionTitle: string;
  order: number;
  videos: Video[];
};

type Course = {
  id: string;
  title: string;
  sections: Section[];
};

function authHeader(): Record<string, string> {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function firstVideo(s: Section) {
  return s.videos[0] ?? null;
}

export function RecordedCourseSectionsManager({ courseId }: { courseId: string }) {
  const { t } = useLanguage();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newType, setNewType] = useState<"intro" | "lesson">("lesson");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      headers: { ...authHeader() },
    });
    if (!res.ok) {
      setError("Could not load course");
      setCourse(null);
      setLoading(false);
      return;
    }
    const { course: c } = (await res.json()) as { course: Course };
    setCourse(c);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = course
    ? [...course.sections].sort((a, b) => a.order - b.order)
    : [];
  const hasIntro = sorted.some((s) => s.type === "intro");

  async function putSection(
    s: Section,
    patch: Partial<{
      type: string;
      sectionTitle: string;
      order: number;
      videoTitle: string;
      videoUrl: string;
      description: string;
    }>,
  ) {
    const v = firstVideo(s);
    const res = await fetch(
      `/api/admin/courses/${courseId}/sections/${s.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify({
          type: patch.type ?? s.type,
          sectionTitle: patch.sectionTitle ?? s.sectionTitle,
          order: patch.order ?? s.order,
          video: v
            ? {
                videoTitle: patch.videoTitle ?? v.videoTitle,
                videoUrl: patch.videoUrl ?? v.videoUrl,
                description: patch.description ?? v.description,
              }
            : {
                videoTitle: patch.videoTitle ?? "",
                videoUrl: patch.videoUrl ?? "",
                description: patch.description ?? "",
              },
        }),
      },
    );
    return res;
  }

  async function onSaveSection(s: Section, draft: {
    sectionTitle: string;
    type: "intro" | "lesson";
    videoTitle: string;
    videoUrl: string;
    description: string;
  }) {
    setError(null);
    if (!draft.sectionTitle.trim() || !draft.videoTitle.trim() || !draft.videoUrl.trim()) {
      setError("Section title, video title, and video URL are required.");
      return;
    }
    if (draft.type === "intro" && s.type === "lesson") {
      if (sorted.some((o) => o.id !== s.id && o.type === "intro")) {
        setError(t("admin_recorded_intro_exists"));
        return;
      }
    }
    setSaving(s.id);
    const res = await putSection(s, {
      type: draft.type,
      sectionTitle: draft.sectionTitle.trim(),
      videoTitle: draft.videoTitle.trim(),
      videoUrl: draft.videoUrl.trim(),
      description: draft.description,
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error || "Save failed");
      setSaving(null);
      return;
    }
    setSaving(null);
    await load();
  }

  async function onDelete(s: Section) {
    if (!window.confirm("Delete this section?")) return;
    setDeleting(s.id);
    setError(null);
    const res = await fetch(
      `/api/admin/courses/${courseId}/sections/${s.id}`,
      { method: "DELETE", headers: { ...authHeader() } },
    );
    if (!res.ok) {
      setError("Delete failed");
      setDeleting(null);
      return;
    }
    setDeleting(null);
    await load();
  }

  async function move(s: Section, dir: "up" | "down") {
    const list = sorted;
    const idx = list.findIndex((x) => x.id === s.id);
    if (idx < 0) return;
    const j = dir === "up" ? idx - 1 : idx + 1;
    if (j < 0 || j >= list.length) return;
    const a = list[idx]!;
    const b = list[j]!;
    setError(null);
    setSaving("reorder");
    const r1 = await putSection(a, { order: b.order });
    if (!r1.ok) {
      setError("Reorder failed");
      setSaving(null);
      return;
    }
    const r2 = await putSection(b, { order: a.order });
    if (!r2.ok) {
      setError("Reorder failed");
      setSaving(null);
      return;
    }
    setSaving(null);
    await load();
  }

  async function onAddSection(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newType === "intro" && hasIntro) {
      setError(t("admin_recorded_intro_exists"));
      return;
    }
    if (!newSectionTitle.trim() || !newVideoTitle.trim() || !newVideoUrl.trim()) {
      setError("Fill section title, video title, and video URL.");
      return;
    }
    setSaving("new");
    const res = await fetch(`/api/admin/courses/${courseId}/sections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(),
      },
      body: JSON.stringify({
        type: newType,
        sectionTitle: newSectionTitle.trim(),
        video: {
          videoTitle: newVideoTitle.trim(),
          videoUrl: newVideoUrl.trim(),
          description: newDesc,
        },
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error || "Could not add section");
      setSaving(null);
      return;
    }
    setNewSectionTitle("");
    setNewVideoTitle("");
    setNewVideoUrl("");
    setNewDesc("");
    setNewType("lesson");
    setSaving(null);
    await load();
  }

  if (loading) {
    return <p className="text-neutral-600">{t("admin_courses_loading")}</p>;
  }
  if (!course) {
    return <p className="text-red-600">{error ?? t("course_not_found")}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/courses"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← {t("admin_recorded_back_courses")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">
          {course.title}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {t("admin_recorded_sections_link")}
        </p>
        <p className="mt-2">
          <Link
            href={`/admin/courses/${courseId}/edit`}
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("admin_course_edit")}
          </Link>
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <ul className="space-y-4">
        {sorted.map((s, idx) => (
          <li key={s.id}>
            <SectionCard
              s={s}
              idx={idx}
              total={sorted.length}
              disabled={saving === s.id || saving === "reorder" || !!deleting}
              onSave={onSaveSection}
              onDelete={onDelete}
              onMove={move}
              hasIntro={hasIntro}
              t={t}
            />
          </li>
        ))}
      </ul>

      <Card interactive={false} className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t("admin_recorded_new_section")}
        </h2>
        <p className="text-sm text-amber-800">
          {t("admin_recorded_add_intro")} / {t("admin_recorded_add_lesson")}
        </p>
        <form onSubmit={onAddSection} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              {t("admin_recorded_section_type")}
            </label>
            <select
              className="w-full max-w-xs rounded-xl border border-neutral-200 px-3 py-2"
              value={newType}
              onChange={(e) =>
                setNewType(e.target.value === "intro" ? "intro" : "lesson")
              }
            >
              <option value="intro" disabled={hasIntro}>
                intro {hasIntro ? "(already set)" : ""}
              </option>
              <option value="lesson">lesson</option>
            </select>
            {newType === "intro" && hasIntro ? (
              <p className="mt-1 text-xs text-amber-800">
                {t("admin_recorded_intro_exists")}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600">
              {t("admin_recorded_section_title")}
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600">
              {t("admin_lesson_title_label")}
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600">
              {t("admin_lesson_url_label")}
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="https://youtube.com/… or vimeo"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600">
              {t("admin_lesson_description_label")}
            </label>
            <textarea
              className="mt-1 min-h-[4rem] w-full rounded-xl border border-neutral-200 px-3 py-2"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={saving === "new"}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving === "new" ? "…" : t("admin_recorded_create_section")}
          </button>
        </form>
      </Card>
    </div>
  );
}

function SectionCard({
  s,
  idx,
  total,
  disabled,
  onSave,
  onDelete,
  onMove,
  hasIntro,
  t,
}: {
  s: Section;
  idx: number;
  total: number;
  disabled: boolean;
  onSave: (s: Section, d: {
    sectionTitle: string;
    type: "intro" | "lesson";
    videoTitle: string;
    videoUrl: string;
    description: string;
  }) => void;
  onDelete: (s: Section) => void;
  onMove: (s: Section, d: "up" | "down") => void;
  hasIntro: boolean;
  t: (k: TranslationKey) => string;
}) {
  const v0 = firstVideo(s);
  const [sectionTitle, setSectionTitle] = useState(s.sectionTitle);
  const [type, setType] = useState<"intro" | "lesson">(
    s.type === "intro" ? "intro" : "lesson",
  );
  const [videoTitle, setVideoTitle] = useState(v0?.videoTitle ?? "");
  const [videoUrl, setVideoUrl] = useState(v0?.videoUrl ?? "");
  const [description, setDescription] = useState(v0?.description ?? "");

  useEffect(() => {
    setSectionTitle(s.sectionTitle);
    setType(s.type === "intro" ? "intro" : "lesson");
    const v = firstVideo(s);
    setVideoTitle(v?.videoTitle ?? "");
    setVideoUrl(v?.videoUrl ?? "");
    setDescription(v?.description ?? "");
  }, [s]);

  return (
    <Card interactive={false} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            s.type === "intro" ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800"
          }`}
        >
          {s.type === "intro" ? "intro" : "lesson"} · order {s.order}
        </span>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className="rounded-lg border border-neutral-200 px-2 py-1 text-sm disabled:opacity-50"
            onClick={() => onMove(s, "up")}
            disabled={disabled || idx === 0}
            aria-label={t("admin_recorded_move_up")}
          >
            ↑
          </button>
          <button
            type="button"
            className="rounded-lg border border-neutral-200 px-2 py-1 text-sm disabled:opacity-50"
            onClick={() => onMove(s, "down")}
            disabled={disabled || idx === total - 1}
            aria-label={t("admin_recorded_move_down")}
          >
            ↓
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs text-neutral-600">{t("admin_recorded_section_type")}</label>
        <select
          className="mt-1 w-full max-w-xs rounded-xl border border-neutral-200 px-3 py-2"
          value={type}
          onChange={(e) =>
            setType(e.target.value === "intro" ? "intro" : "lesson")
          }
        >
          <option
            value="intro"
            disabled={hasIntro && s.type !== "intro"}
          >
            intro
          </option>
          <option value="lesson">lesson</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-neutral-600">Section title</label>
        <input
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          value={sectionTitle}
          onChange={(e) => setSectionTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-neutral-600">Video title</label>
        <input
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-neutral-600">Video URL</label>
        <input
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-neutral-600">Description</label>
        <textarea
          className="mt-1 min-h-[3rem] w-full rounded-xl border border-neutral-200 px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onSave(s, {
              sectionTitle,
              type,
              videoTitle,
              videoUrl,
              description,
            })
          }
          disabled={disabled}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t("admin_course_save")}
        </button>
        <button
          type="button"
          onClick={() => onDelete(s)}
          disabled={disabled}
          className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
        >
          {t("admin_course_delete")}
        </button>
      </div>
    </Card>
  );
}
