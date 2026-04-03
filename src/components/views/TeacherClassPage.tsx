"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { ClassDayProgress } from "@/components/class/ClassDayProgress";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getClassById,
  markDayComplete,
  unlockNextClassDay,
  type ClassRecord,
} from "@/lib/classes-store";
import { listTeachers } from "@/lib/teachers-store";

type Props = { classId: string };

export function TeacherClassPage({ classId }: Props) {
  const { t } = useLanguage();
  const [cls, setCls] = useState<ClassRecord | null | undefined>(undefined);
  const [, setUsersTick] = useState(0);

  const refresh = useCallback(() => {
    setCls(getClassById(classId) ?? null);
  }, [classId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function onUsersUpdated() {
      setUsersTick((x) => x + 1);
    }
    window.addEventListener("motiva-users-updated", onUsersUpdated);
    return () =>
      window.removeEventListener("motiva-users-updated", onUsersUpdated);
  }, []);

  function handleMarkComplete() {
    markDayComplete(classId);
    refresh();
  }

  function handleUnlockNext() {
    unlockNextClassDay(classId);
    refresh();
  }

  if (cls === undefined) {
    return (
      <div className="py-12 text-center text-neutral-400" aria-busy="true">
        …
      </div>
    );
  }

  if (cls === null) {
    return (
      <Card className="p-8 text-center shadow-md">
        <p className="text-neutral-600">{t("class_not_found")}</p>
        <Link
          href="/teacher"
          className="mt-4 inline-block font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← {t("back")}
        </Link>
      </Card>
    );
  }

  const teacherName =
    listTeachers().find((x) => x.id === cls.teacherId)?.name ?? "—";

  const allDone =
    cls.completedDays >= cls.duration && cls.unlockedDay >= cls.duration;
  const canMark =
    cls.completedDays < cls.duration && cls.completedDays < cls.unlockedDay;
  const canUnlock =
    cls.unlockedDay < cls.duration && cls.completedDays >= cls.unlockedDay;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href="/teacher"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← {t("class_back_teacher")}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
          {cls.name}
        </h1>
        <p className="mt-1 text-neutral-600">
          {teacherName} · {cls.duration} {t("admin_classes_days_short")}
        </p>
      </div>

      <Card className="p-6 shadow-lg sm:p-8">
        <h2 className="mb-6 text-lg font-semibold text-neutral-800">
          {t("class_progress_heading")}
        </h2>
        <ClassDayProgress classRecord={cls} />
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button
          type="button"
          onClick={handleMarkComplete}
          disabled={!canMark}
          className="min-h-16 flex-1 text-lg"
        >
          {allDone ? t("class_all_done") : t("class_mark_complete")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleUnlockNext}
          disabled={!canUnlock}
          className="min-h-16 flex-1 text-lg"
        >
          {t("class_unlock_next")}
        </Button>
      </div>
    </div>
  );
}
