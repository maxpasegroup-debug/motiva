"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getAuthToken } from "@/lib/session";

type Program = {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  image_url: string;
  description: string;
  is_active: boolean;
};

export function AdminProgramsPage() {
  const { t } = useLanguage();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [duration, setDuration] = useState<12 | 25>(12);
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

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

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSubtitle("");
    setDuration(12);
    setImageUrl("");
    setDescription("");
    setIsActive(true);
  }

  function startEdit(p: Program) {
    setEditingId(p.id);
    setTitle(p.title);
    setSubtitle(p.subtitle);
    setDuration(p.duration === 25 ? 25 : 12);
    setImageUrl(p.image_url);
    setDescription(p.description);
    setIsActive(p.is_active);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAuthToken();
    if (!token || !title.trim()) return;

    setError(null);
    if (editingId) {
      const res = await fetch(`/api/admin/programs/${editingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          subtitle,
          duration,
          image_url: imageUrl,
          description,
          is_active: isActive,
        }),
      });
      if (!res.ok) {
        setError("Could not save");
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
          subtitle,
          duration,
          image_url: imageUrl,
          description,
          is_active: isActive,
        }),
      });
      if (!res.ok) {
        setError("Could not add");
        return;
      }
    }
    resetForm();
    refresh();
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
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {t("admin_programs_title")}
        </h1>
        <p className="mt-2 text-lg text-neutral-600">{t("admin_programs_sub")}</p>
      </div>

      <Card className="border-2 border-primary/15 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-foreground">
          {editingId ? t("admin_programs_edit") : t("admin_programs_add")}
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="block text-left text-sm font-medium text-neutral-700">
            {t("admin_programs_field_title")}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
            />
          </label>
          <label className="block text-left text-sm font-medium text-neutral-700">
            {t("admin_programs_field_subtitle")}
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
            />
          </label>
          <label className="block text-left text-sm font-medium text-neutral-700">
            {t("admin_programs_field_duration")}
            <select
              value={duration}
              onChange={(e) =>
                setDuration(Number(e.target.value) === 25 ? 25 : 12)
              }
              className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
            >
              <option value={12}>12</option>
              <option value={25}>25</option>
            </select>
          </label>
          <label className="block text-left text-sm font-medium text-neutral-700">
            {t("admin_programs_field_image")}
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="mt-2 min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-lg"
            />
          </label>
          <label className="block text-left text-sm font-medium text-neutral-700">
            {t("admin_programs_field_description")}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-neutral-300 px-4 py-3 text-base"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 font-medium">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-6 w-6"
            />
            {t("admin_programs_active")}
          </label>
          {error ? (
            <p className="text-sm font-medium text-accent">{error}</p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="min-h-14 text-lg">
              {editingId ? t("admin_programs_save") : t("admin_programs_create")}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="min-h-14 text-lg"
              >
                {t("admin_programs_cancel")}
              </Button>
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
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="text-left">
                      <p className="text-lg font-bold text-foreground">{p.title}</p>
                      <p className="text-neutral-600">{p.subtitle}</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {p.duration} days ·{" "}
                        {p.is_active
                          ? t("admin_programs_status_on")
                          : t("admin_programs_status_off")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="min-h-12"
                      >
                        {t("admin_programs_edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => toggleActive(p)}
                        className="min-h-12"
                      >
                        {p.is_active
                          ? t("admin_programs_deactivate")
                          : t("admin_programs_activate")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleDelete(p.id)}
                        className="min-h-12 text-accent"
                      >
                        {t("admin_delete")}
                      </Button>
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
