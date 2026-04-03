"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSession } from "@/lib/session";
import { listClasses, type ClassRecord } from "@/lib/classes-store";
import { listStudents, type StudentRecord } from "@/lib/students-store";
import { setClassStudentIds } from "@/lib/class-students-store";

export function DashboardJoinPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [availableClasses, setAvailableClasses] = useState<ClassRecord[]>([]);
  const [busyClassId, setBusyClassId] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    const s = listStudents().find((x) => x.id === session?.userId) ?? null;
    setStudent(s);
    if (!s) {
      setAvailableClasses([]);
      return;
    }

    const all = listClasses();
    setAvailableClasses(all.filter((c) => !c.studentIds.includes(s.id)));
  }, []);

  const sortedAvailable = useMemo(() => {
    return [...availableClasses].sort((a, b) => a.name.localeCompare(b.name));
  }, [availableClasses]);

  const handleJoin = useCallback(
    (classId: string) => {
      if (!student) return;
      const cls = availableClasses.find((c) => c.id === classId);
      if (!cls) return;

      setBusyClassId(classId);
      const nextIds = Array.from(
        new Set<string>([...cls.studentIds, student.id]),
      );
      setClassStudentIds(classId, nextIds);
      router.push(`/dashboard/class/${classId}`);
    },
    [availableClasses, router, student],
  );

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
          {t("join_class")}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">{t("join_description")}</p>
      </div>

      {sortedAvailable.length === 0 ? (
        <Card className="p-8 text-center shadow-md">
          <p className="text-neutral-600">{t("join_no_available_batches")}</p>
          <p className="mt-3 text-sm text-neutral-500">
            {t("join_no_available_hint")}
          </p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {sortedAvailable.map((c) => (
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
                      type="button"
                      onClick={() => handleJoin(c.id)}
                      disabled={busyClassId === c.id}
                      className="min-h-14"
                    >
                      {t("join_button")}
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

