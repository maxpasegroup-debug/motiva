"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { getAuthToken } from "@/lib/session";

type Props = { classId: string };

type BatchPayload = {
  id: string;
  name: string;
  duration: 12 | 25;
};

type DayRow = {
  day_number: number;
  unlocked: boolean;
  past: boolean;
  attendance: "present" | "absent" | null;
};

export function StudentClassPage({ classId }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const [batch, setBatch] = useState<BatchPayload | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [days, setDays] = useState<DayRow[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setBatch(null);
      setAllowed(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/student/batches/${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setBatch(null);
        setAllowed(false);
        return;
      }
      const json = (await res.json()) as {
        success?: boolean;
        batch?: BatchPayload;
        current_day?: number;
        days?: DayRow[];
      };
      if (json.success && json.batch) {
        setBatch(json.batch);
        setCurrentDay(json.current_day ?? 1);
        setDays(json.days ?? []);
        setAllowed(true);
      } else {
        setBatch(null);
        setAllowed(false);
      }
    } catch {
      setBatch(null);
      setAllowed(false);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!getAuthToken()) {
      router.replace("/login");
    }
  }, [router]);

  if (loading) {
    return (
      <div className="py-12 text-center text-neutral-400" aria-busy="true">
        …
      </div>
    );
  }

  if (!batch || !allowed) {
    return (
      <Card className="p-8 text-center shadow-md">
        <p className="text-neutral-600">{t("class_no_access")}</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← {t("class_back_student")}
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← {t("class_back_student")}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
          {batch.name}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {t("student_batch_current_day").replace("{n}", String(currentDay))}
        </p>
      </div>

      <Card className="p-6 shadow-lg sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-800">
          {t("student_day_progress_title")}
        </h2>
        <ul className="space-y-3">
          {days.map((d) => {
            let stateIcon: string;
            if (!d.unlocked) stateIcon = "🔒";
            else if (d.past) stateIcon = "✅";
            else stateIcon = "🔓";
            let att = "";
            if (d.unlocked && d.attendance === "present") att = " ✔";
            else if (d.unlocked && d.attendance === "absent") att = " ❌";
            else if (d.unlocked && d.attendance === null) att = " · —";
            return (
              <li
                key={d.day_number}
                className="flex min-h-14 items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm"
              >
                <span className="font-semibold text-foreground">
                  {t("class_day")} {d.day_number}
                </span>
                <span className="text-lg tabular-nums" aria-hidden>
                  {stateIcon}
                  {att}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
