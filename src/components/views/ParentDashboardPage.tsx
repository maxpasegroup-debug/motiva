"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getAuthToken } from "@/lib/session";

type DayRow = { day_number: number; attendance: "present" | "absent" | null };

type Notif = {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

type DashboardJson =
  | {
      success: true;
      linked: false;
      message?: string;
    }
  | {
      success: true;
      linked: true;
      enrolled: boolean;
      parent: { name: string; phone: string };
      student: { id: string; name: string };
      batch: {
        id: string;
        name: string;
        duration: number;
        current_day: number;
      } | null;
      course: { title: string } | null;
      progress_label: string | null;
      days: DayRow[];
      payment: { status: "paid" | "pending" };
      notifications: Notif[];
      unread_count: number;
    };

function waUrl(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCc =
    digits.length === 10 ? `91${digits}` : digits.startsWith("91") ? digits : digits;
  const q = new URLSearchParams();
  q.set("text", message);
  return `https://wa.me/${withCc}?${q.toString()}`;
}

export function ParentDashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardJson | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoadError(t("parent_dashboard_unauthorized"));
      setLoading(false);
      return;
    }
    setLoadError(null);
    try {
      const res = await fetch("/api/parent/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as DashboardJson & {
        error?: string;
      };
      if (!res.ok) {
        setLoadError(json.error ?? t("parent_dashboard_error"));
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setLoadError(t("parent_dashboard_error"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!bellRef.current?.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const markRead = useCallback(
    async (ids: string[]) => {
      const token = getAuthToken();
      if (!token || ids.length === 0) return;
      await fetch("/api/parent/notifications/read", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });
      void load();
    },
    [load],
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-12 text-center text-neutral-600">
        {t("course_player_loading")}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-12 text-center">
        <p className="text-accent">{loadError}</p>
        <Button type="button" className="mt-6" onClick={() => void load()}>
          {t("parent_dashboard_retry")}
        </Button>
      </div>
    );
  }

  if (!data?.success) return null;

  if (!data.linked) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t("parent_home_title")}
        </h1>
        <Card className="mt-6 p-6 text-neutral-700">
          <p>{data.message ?? t("parent_not_linked")}</p>
        </Card>
      </div>
    );
  }

  type LinkedDash = Extract<DashboardJson, { linked: true }>;
  const d = data as LinkedDash;
  const unread = "unread_count" in d ? d.unread_count : 0;
  const notifs = "notifications" in d ? d.notifications : [];

  const whatsapp = waUrl(
    d.parent.phone,
    t("parent_whatsapp_default_message"),
  );

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            ← {t("home")}
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">
            {t("parent_home_title")}
          </h1>
        </div>
        <div className="relative shrink-0" ref={bellRef}>
          <button
            type="button"
            className="relative flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-2xl shadow-sm"
            aria-label={t("parent_notifications_aria")}
            onClick={(e) => {
              e.stopPropagation();
              setBellOpen((v) => !v);
            }}
          >
            🔔
            {unread > 0 ? (
              <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </button>
          {bellOpen ? (
            <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] max-h-80 overflow-y-auto rounded-xl border border-neutral-200 bg-white py-2 shadow-xl">
              {notifs.length === 0 ? (
                <p className="px-4 py-3 text-sm text-neutral-500">
                  {t("parent_notifications_empty")}
                </p>
              ) : (
                <ul>
                  {notifs.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        className={`w-full px-4 py-3 text-left text-sm ${
                          n.is_read ? "text-neutral-600" : "bg-primary/10 font-medium text-foreground"
                        }`}
                        onClick={() => {
                          if (!n.is_read) void markRead([n.id]);
                        }}
                      >
                        {n.message}
                        <span className="mt-1 block text-xs text-neutral-400">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {notifs.some((n) => !n.is_read) ? (
                <div className="border-t border-neutral-100 px-2 py-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full min-h-10 text-sm"
                    onClick={() =>
                      void markRead(notifs.filter((n) => !n.is_read).map((n) => n.id))
                    }
                  >
                    {t("parent_notifications_mark_all")}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <Card className="p-6 shadow-lg sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {t("parent_card_student")}
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">{d.student.name}</p>
        {d.enrolled && d.course ? (
          <>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("parent_card_course")}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {d.course.title}
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {t("parent_batch")}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {d.batch?.name ?? "—"}
            </p>
          </>
        ) : (
          <p className="mt-4 text-neutral-600">{t("parent_not_enrolled_yet")}</p>
        )}
      </Card>

      {d.enrolled && d.progress_label ? (
        <Card className="p-6 shadow-lg sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t("parent_progress_heading")}
          </p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-primary">
            {d.progress_label}
          </p>
        </Card>
      ) : null}

      {d.enrolled && d.days.length > 0 ? (
        <Card className="p-6 shadow-lg sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {t("parent_attendance_heading")}
          </p>
          <ul className="mt-4 space-y-2">
            {d.days.map((row) => {
              let mark = "—";
              if (row.attendance === "present") mark = "✔";
              else if (row.attendance === "absent") mark = "❌";
              return (
                <li
                  key={row.day_number}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/80 px-4 py-3"
                >
                  <span className="font-medium text-foreground">
                    {t("class_day")} {row.day_number}
                  </span>
                  <span className="text-lg" aria-hidden>
                    {mark}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      <Card className="p-6 shadow-lg sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {t("parent_payment")}
        </p>
        <p
          className={`mt-2 text-2xl font-bold ${
            d.payment.status === "paid" ? "text-primary" : "text-accent"
          }`}
        >
          {d.payment.status === "paid"
            ? t("parent_payment_paid")
            : t("parent_payment_pending")}
        </p>
      </Card>

      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-[#25D366] bg-[#25D366]/10 px-4 text-center text-base font-semibold text-[#128C7E]"
        >
          <span aria-hidden>💬</span>
          {t("parent_whatsapp_open")}
        </a>
      ) : null}
    </div>
  );
}
