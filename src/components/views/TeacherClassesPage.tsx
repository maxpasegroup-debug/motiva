"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { listClasses, type ClassRecord } from "@/lib/classes-store";
import { listTeachers } from "@/lib/teachers-store";
import { TeacherBackLink } from "@/components/views/TeacherSubPageLayout";

export function TeacherClassesPage() {
  const { t } = useLanguage();
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [, setUsersTick] = useState(0);

  const refresh = useCallback(() => setClasses(listClasses()), []);

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

  return (
    <div className="space-y-8">
      <TeacherBackLink />
      <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
        {t("teacher_nav_classes")}
      </h1>

      {classes.length === 0 ? (
        <Card className="p-8 text-center text-neutral-500 shadow-md">
          {t("class_teacher_no_batches")}
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {classes.map((c) => {
            const teacherName =
              listTeachers().find((x) => x.id === c.teacherId)?.name ?? "—";
            return (
              <li key={c.id}>
                <Link
                  href={`/teacher/class/${c.id}`}
                  className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-md transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-lg sm:min-h-[180px]"
                >
                  <span className="text-5xl leading-none sm:text-6xl" aria-hidden>
                    📅
                  </span>
                  <p className="text-lg font-bold text-foreground sm:text-xl">
                    {c.name}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {teacherName} · {c.completedDays}/{c.duration}{" "}
                    {t("class_days_done_suffix")}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {t("class_tap_progress")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
