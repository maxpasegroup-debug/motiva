"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { listClassesForStudent } from "@/lib/classes-store";
import { getStudentPaymentStatus } from "@/lib/student-payments-store";
import { listProfilesForParent } from "@/lib/student-profiles-store";
import { listStudents } from "@/lib/students-store";
import { getSession } from "@/lib/session";

export default function ParentHomePage() {
  const { t } = useLanguage();
  const [lines, setLines] = useState<
    {
      studentId: string;
      name: string;
      batch: string;
      days: string;
      pay: string;
    }[]
  >([]);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "parent") return;
    const profiles = listProfilesForParent(s.userId);
    const names = new Map(listStudents().map((x) => [x.id, x.name] as const));
    const out = profiles.map((p) => {
      const batches = listClassesForStudent(p.studentId);
      const b = batches[0];
      const pay =
        getStudentPaymentStatus(p.studentId) === "paid"
          ? "✅"
          : "❌";
      return {
        studentId: p.studentId,
        name: names.get(p.studentId) ?? p.studentId,
        batch: b?.name ?? "—",
        days: b
          ? `${b.completedDays}/${b.duration} · ${t("class_day")} ${b.unlockedDay}`
          : "—",
        pay,
      };
    });
    setLines(out);
  }, [t]);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-bold text-foreground">
        {t("parent_home_title")}
      </h1>
      {lines.length === 0 ? (
        <p className="mt-8 text-center text-neutral-600">
          {t("parent_no_children")}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {lines.map((x) => (
            <li key={x.studentId}>
              <Card className="p-6">
                <p className="text-xl font-bold text-foreground">{x.name}</p>
                <p className="mt-2 text-neutral-700">
                  <span className="font-semibold">{t("parent_batch")}:</span>{" "}
                  {x.batch}
                </p>
                <p className="mt-1 text-neutral-700">
                  <span className="font-semibold">{t("parent_days")}:</span>{" "}
                  {x.days}
                </p>
                <p className="mt-1 text-neutral-700">
                  <span className="font-semibold">{t("parent_payment")}:</span>{" "}
                  {x.pay}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
