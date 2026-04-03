"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getSession } from "@/lib/session";
import { listClasses, type ClassRecord } from "@/lib/classes-store";
import { listStudents } from "@/lib/students-store";

export function DashboardLessonsPage() {
  const { t } = useLanguage();

  const [myClasses, setMyClasses] = useState<ClassRecord[]>([]);

  useEffect(() => {
    const session = getSession();
    const student = listStudents().find((s) => s.id === session?.userId);
    if (!student) {
      setMyClasses([]);
      return;
    }

    setMyClasses(listClasses().filter((c) => c.studentIds.includes(student.id)));
  }, []);

  const sorted = useMemo(() => {
    return [...myClasses].sort((a, b) => a.name.localeCompare(b.name));
  }, [myClasses]);

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← {t("back")}
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
          {t("my_courses")}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">{t("lessons_description")}</p>
      </div>

      {sorted.length === 0 ? (
        <Card className="p-8 text-center shadow-md">
          <p className="text-neutral-600">{t("lessons_empty")}</p>
          <Link
            href="/dashboard/join"
            className="mt-4 inline-block font-semibold text-primary underline-offset-4 hover:underline"
          >
            {t("join_class")}
          </Link>
        </Card>
      ) : (
        <ul className="space-y-4">
          {sorted.map((c) => (
            <li key={c.id}>
              <Card className="p-6 shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-foreground">
                      {c.name}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {c.completedDays} ✅ done · {c.unlockedDay} 🔓 unlocked ·{" "}
                      {c.duration - c.unlockedDay} 🔒 locked
                    </p>
                  </div>

                  <div className="shrink-0">
                    <Button
                      href={`/dashboard/class/${c.id}`}
                      className="min-h-14"
                    >
                      {t("lessons_continue")}
                    </Button>
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

