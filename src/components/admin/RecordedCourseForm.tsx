"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { COURSE_TARGET_ROLES } from "@/lib/recorded-courses";
import { getAuthToken } from "@/lib/session";

type Props = { mode: "new" | "edit"; courseId?: string };

function authHeader(): Record<string, string> {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function RecordedCourseForm({ mode, courseId }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [targetRole, setTargetRole] = useState<string>("public");
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadNote, setUploadNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (mode !== "edit" || !courseId) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/courses/${courseId}`, {
      headers: { ...authHeader() },
    });
    if (!res.ok) {
      setError("Could not load course");
      setLoading(false);
      return;
    }
    const { course: c } = (await res.json()) as {
      course: {
        title: string;
        description: string;
        thumbnail: string;
        targetRole: string;
        price: number;
        status: string;
      };
    };
    setTitle(c.title);
    setDescription(c.description);
    setThumbnail(c.thumbnail);
    setTargetRole(c.targetRole);
    setPrice(c.price);
    setStatus(c.status === "published" ? "published" : "draft");
    setPreviewUrl(c.thumbnail);
    setLoading(false);
  }, [mode, courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) {
      setPendingFile(null);
      setPreviewUrl(thumbnail || null);
      return;
    }
    setPendingFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  useEffect(
    () => () => {
      if (pendingFile && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    },
    [pendingFile, previewUrl],
  );

  async function uploadToCloudinary(file: File): Promise<string | null> {
    const token = getAuthToken();
    if (!token) return null;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/courses/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (res.status === 503) {
      setUploadNote(t("admin_recorded_upload_unavailable"));
      return null;
    }
    if (!res.ok) return null;
    const j = (await res.json()) as { url?: string };
    return j.url ?? null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setUploadNote(null);
    if (!getAuthToken()) {
      setError(t("admin_session_required"));
      return;
    }
    if (!title.trim()) {
      setError(t("admin_course_name_required"));
      return;
    }

    setSaving(true);
    let th = thumbnail.trim();
    if (pendingFile) {
      const u = await uploadToCloudinary(pendingFile);
      if (u) th = u;
    }
    if (!th) {
      setError(t("admin_recorded_url_required"));
      setSaving(false);
      return;
    }

    const body = {
      title: title.trim(),
      description: description.trim(),
      thumbnail: th,
      targetRole,
      price: Math.max(0, price),
      status,
    };

    if (mode === "new") {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error || "Save failed");
        setSaving(false);
        return;
      }
      const { course: created } = (await res.json()) as { course: { id: string } };
      setSaving(false);
      router.push(`/admin/courses/${created.id}/sections`);
    } else {
      if (!courseId) {
        setSaving(false);
        return;
      }
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(),
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error || "Save failed");
        setSaving(false);
        return;
      }
      setSaving(false);
      router.push("/admin/courses");
    }
  }

  if (mode === "edit" && loading) {
    return <p className="text-neutral-600">{t("admin_courses_loading")}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/courses"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← {t("admin_recorded_back_courses")}
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">
          {mode === "new" ? t("admin_course_add_heading") : t("admin_course_details_section")}
        </h1>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {uploadNote && (
        <p className="text-sm text-amber-800">{uploadNote}</p>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="space-y-4" interactive={false}>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="rc-title">
              {t("admin_course_title_label")}
            </label>
            <input
              id="rc-title"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="rc-desc">
              {t("admin_course_description_label")}
            </label>
            <textarea
              id="rc-desc"
              className="min-h-[7rem] w-full rounded-xl border border-neutral-200 px-3 py-2.5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-neutral-700">
              {t("admin_course_thumbnail_label")} (Cloudinary)
            </p>
            <p className="mb-2 text-xs text-neutral-500">
              {t("admin_course_thumbnail_hint")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              {previewUrl ? (
                <div className="relative h-32 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                  <Image
                    src={previewUrl}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="text-sm"
                />
                <input
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  placeholder="https://… (paste URL if not uploading)"
                  value={thumbnail}
                  onChange={(e) => {
                    setThumbnail(e.target.value);
                    if (!pendingFile) setPreviewUrl(e.target.value || null);
                  }}
                />
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="rc-role">
              {t("admin_recorded_target_role")}
            </label>
            <select
              id="rc-role"
              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              {COURSE_TARGET_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700" htmlFor="rc-price">
              {t("admin_recorded_price")}
            </label>
            <input
              id="rc-price"
              type="number"
              min={0}
              step="0.01"
              className="w-full max-w-xs rounded-xl border border-neutral-200 px-3 py-2.5"
              value={Number.isFinite(price) ? price : 0}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">
              {t("admin_recorded_published")} / {t("admin_recorded_draft")}
            </p>
            <div className="inline-flex rounded-xl border border-neutral-200 p-1">
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  status === "draft" ? "bg-primary text-white" : "text-neutral-600"
                }`}
                onClick={() => setStatus("draft")}
              >
                {t("admin_recorded_draft")}
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  status === "published" ? "bg-primary text-white" : "text-neutral-600"
                }`}
                onClick={() => setStatus("published")}
              >
                {t("admin_recorded_published")}
              </button>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="!w-auto" disabled={saving}>
            {saving
              ? mode === "new"
                ? t("admin_recorded_creating")
                : t("admin_recorded_saving")
              : t("admin_course_save")}
          </Button>
          {mode === "edit" && courseId ? (
            <Button
              href={`/admin/courses/${courseId}/sections`}
              variant="outline"
              className="!w-auto"
            >
              {t("admin_recorded_sections_link")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
