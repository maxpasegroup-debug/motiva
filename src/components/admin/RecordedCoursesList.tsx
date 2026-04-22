"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getAuthToken } from "@/lib/session";

type CourseRow = {
  id: string;
  title: string;
  thumbnail: string;
  status: string;
  targetRole: string;
  price: number;
  _count: { sections: number; enrollments: number };
};

function authHeader(): Record<string, string> {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function RecordedCoursesList() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/courses", {
      headers: { ...authHeader() },
    });
    if (!res.ok) {
      setError("Could not load courses");
      setRows([]);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { courses: CourseRow[] };
    setRows(data.courses ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onDelete(id: string) {
    if (!getAuthToken()) return;
    if (!window.confirm(t("admin_course_delete_confirm"))) return;
    setDeleting(id);
    setError(null);
    const res = await fetch(`/api/admin/courses/${id}`, {
      method: "DELETE",
      headers: { ...authHeader() },
    });
    if (!res.ok) {
      setError("Delete failed");
      setDeleting(null);
      return;
    }
    setDeleting(null);
    await load();
  }

  if (loading) {
    return (
      <p className="text-neutral-600">{t("admin_courses_loading")}</p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {t("admin_nav_courses")}
          </h1>
          <p className="mt-1 text-neutral-600">{t("admin_courses_sub")}</p>
        </div>
        <Button href="/admin/courses/new" className="!w-auto self-start sm:min-w-[12rem]">
          {t("admin_courses_create")}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <Card interactive={false} className="text-center text-neutral-600">
          {t("admin_courses_empty")}
        </Card>
      ) : (
        <ul className="space-y-4">
          {rows.map((c) => (
            <li key={c.id}>
              <Card
                className="flex flex-col gap-4 sm:flex-row sm:items-stretch"
                interactive={false}
              >
                <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:w-48">
                  {c.thumbnail ? (
                    <Image
                      src={c.thumbnail}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-neutral-900">
                      {c.title}
                    </h2>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        c.status === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.status === "published"
                        ? t("admin_recorded_published")
                        : t("admin_recorded_draft")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    {c.targetRole} · {c.price <= 0 ? t("admin_recorded_free") : `₹${c.price}`} · {c._count.sections} sections
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/admin/courses/${c.id}/edit`}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-primary bg-white px-4 text-sm font-semibold text-primary shadow-sm hover:bg-neutral-50"
                    >
                      {t("admin_course_edit")}
                    </Link>
                    <Link
                      href={`/admin/courses/${c.id}/sections`}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-primary bg-white px-4 text-sm font-semibold text-primary shadow-sm hover:bg-neutral-50"
                    >
                      {t("admin_recorded_sections_link")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      disabled={deleting === c.id}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {t("admin_course_delete")}
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
