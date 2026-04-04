"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getAuthToken } from "@/lib/session";

type Program = {
  id: string;
  title: string;
  description: string;
  image_path: string;
  is_active: boolean;
};

export function AdminProgramsPage() {
  const { t } = useLanguage();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const previewRevokeRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Unauthorized");
      setLoading(false);
      return;
    }
    setError(null);
    const res = await fetch("/api/admin/programs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setError("Could not load programs");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as { programs: Program[] };
    setPrograms(json.programs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function revokePreview() {
    if (previewRevokeRef.current) {
      URL.revokeObjectURL(previewRevokeRef.current);
      previewRevokeRef.current = null;
    }
  }

  function resetForm() {
    revokePreview();
    setEditingId(null);
    setTitle("");
    setDescription("");
    setImagePath("");
    setPendingFile(null);
    setPreviewUrl(null);
    setIsActive(true);
  }

  function startEdit(p: Program) {
    revokePreview();
    setEditingId(p.id);
    setTitle(p.title);
    setDescription(p.description);
    setImagePath(p.image_path);
    setPendingFile(null);
    setPreviewUrl(p.image_path || null);
    setIsActive(p.is_active);
  }

  useEffect(() => {
    return () => revokePreview();
  }, []);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    revokePreview();
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      setPendingFile(null);
      setPreviewUrl(imagePath || null);
      return;
    }
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    previewRevokeRef.current = url;
    setPreviewUrl(url);
  }

  async function uploadThumbnail(
    file: File,
    token: string,
  ): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/programs/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) {
      return null;
    }
    const json = (await res.json()) as { path?: string };
    return typeof json.path === "string" ? json.path : null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !title.trim()) return;

    setError(null);
    setSaving(true);

    try {
      let path = imagePath.trim();
      if (pendingFile) {
        const uploaded = await uploadThumbnail(pendingFile, token);
        if (!uploaded) {
          setError("Could not upload image");
          setSaving(false);
          return;
        }
        path = uploaded;
      }

      if (!path) {
        setError(t("admin_programs_thumbnail_required"));
        setSaving(false);
        return;
      }

      if (editingId) {
        const res = await fetch(`/api/admin/programs/${editingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            image_path: path,
            is_active: isActive,
          }),
        });
        if (!res.ok) {
          setError("Could not save");
          setSaving(false);
          return;
        }
      } else {
        const res = await fetch("/api/admin/programs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            description,
            image_path: path,
            is_active: isActive,
          }),
        });
        if (!res.ok) {
          setError("Could not add");
          setSaving(false);
          return;
        }
      }
      resetForm();
      await refresh();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Program) {
    const token = getAuthToken();
    if (!token) return;
    await fetch(`/api/admin/programs/${p.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("admin_programs_delete_confirm"))) return;
    const token = getAuthToken();
    if (!token) return;
    await fetch(`/api/admin/programs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (editingId === id) resetForm();
    refresh();
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-lg text-neutral-600">{t("admin_programs_sub")}</p>
      </div>

      <Card className="border-2 border-primary/15 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-foreground">
          {editingId ? t("admin_programs_edit") : t("admin_programs_add")}
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-neutral-700">
              {t("admin_programs_field_title")}
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg outline-none ring-blue-600/30 focus:border-blue-600 focus:ring-2"
            />
          </label>

          <label className="flex flex-col gap-2 text-left">
            <span className="text-sm font-medium text-neutral-700">
              {t("admin_programs_field_description")}
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base leading-relaxed outline-none ring-blue-600/30 focus:border-blue-600 focus:ring-2"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-neutral-700">
              {t("admin_programs_field_thumbnail")}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="block w-full text-sm text-neutral-600 file:mr-4 file:rounded-xl file:border-0 file:bg-neutral-100 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-neutral-800 hover:file:bg-neutral-200"
            />
            {previewUrl ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt=""
                  className="mx-auto max-h-48 w-full max-w-md object-contain"
                />
              </div>
            ) : null}
          </div>

          <label className="flex cursor-pointer items-center gap-3 font-medium text-neutral-800">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-5 w-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-600"
            />
            {t("admin_programs_active")}
          </label>

          {error ? (
            <p className="text-sm font-medium text-red-600">{error}</p>
          ) : null}

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {saving
                ? "…"
                : editingId
                  ? t("admin_programs_save")
                  : t("admin_programs_create")}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl border-2 border-neutral-200 py-3 text-base font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                {t("admin_programs_cancel")}
              </button>
            ) : null}
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-4 text-xl font-bold">{t("admin_programs_list")}</h2>
        {loading ? (
          <p className="text-neutral-500">{t("admin_programs_loading")}</p>
        ) : programs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 py-12 text-center text-neutral-500">
            {t("admin_programs_none")}
          </p>
        ) : (
          <ul className="space-y-4">
            {programs.map((p) => (
              <li key={p.id}>
                <Card className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4 text-left">
                      {p.image_path ? (
                        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.image_path}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400">
                          —
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-foreground">
                          {p.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
                          {p.description}
                        </p>
                        <p className="mt-2 text-sm text-neutral-500">
                          {p.is_active
                            ? t("admin_programs_status_on")
                            : t("admin_programs_status_off")}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        {t("admin_programs_edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(p)}
                        className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800"
                      >
                        {p.is_active
                          ? t("admin_programs_deactivate")
                          : t("admin_programs_activate")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600"
                      >
                        {t("admin_delete")}
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
