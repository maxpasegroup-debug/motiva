"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { ClassDayProgress } from "@/components/class/ClassDayProgress";
import { Card } from "@/components/ui/Card";
import { getClassById, type ClassRecord } from "@/lib/classes-store";
import { getSession } from "@/lib/session";
import { listStudents } from "@/lib/students-store";

type Props = { classId: string };

export function StudentClassPage({ classId }: Props) {
  const { t } = useLanguage();
  const router = useRouter();
  const [cls, setCls] = useState<ClassRecord | null | undefined>(undefined);
  const [allowed, setAllowed] = useState(false);
  const [usersTick, setUsersTick] = useState(0);

  const refresh = useCallback(() => {
    const session = getSession();
    const student = listStudents().find((s) => s.id === session?.userId);
    const found = getClassById(classId) ?? null;
    setCls(found);
    if (!found || !student || !found.studentIds.includes(student.id)) {
      setAllowed(false);
      return;
    }
    setAllowed(true);
  }, [classId]);

  useEffect(() => {
    function onUsersUpdated() {
      setUsersTick((x) => x + 1);
    }
    window.addEventListener("motiva-users-updated", onUsersUpdated);
    return () =>
      window.removeEventListener("motiva-users-updated", onUsersUpdated);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, usersTick]);

  useEffect(() => {
    if (!getSession()) {
      router.replace("/login");
    }
  }, [router]);

  if (cls === undefined) {
    return (
      <div className="py-12 text-center text-neutral-400" aria-busy="true">
        …
      </div>
    );
  }

  if (cls === null || !allowed) {
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
          {cls.name}
        </h1>
      </div>

      <Card className="p-6 shadow-lg sm:p-8">
        <h2 className="mb-2 text-lg font-semibold text-neutral-800">
          {t("class_progress_heading")}
        </h2>
        <p className="mb-6 text-sm text-neutral-500">
          {t("class_student_unlocked_hint")}
        </p>
        <ClassDayProgress classRecord={cls} />
      </Card>
    </div>
  );
}
