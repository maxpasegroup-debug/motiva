"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { listClasses } from "@/lib/classes-store";
import type { TranslationKey } from "@/lib/i18n";
import { getStudentPaymentStatus } from "@/lib/student-payments-store";
import { listStudents } from "@/lib/students-store";
import { listTeachers } from "@/lib/teachers-store";

type DashboardStats = {
  students: number;
  teachers: number;
  classes: number;
  paidStudents: number;
};

function computeStats(): DashboardStats {
  const students = listStudents();
  return {
    students: students.length,
    teachers: listTeachers().length,
    classes: listClasses().length,
    paidStudents: students.filter(
      (s) => getStudentPaymentStatus(s.id) === "paid",
    ).length,
  };
}

const STAT_CARDS: {
  key: keyof DashboardStats;
  labelKey: TranslationKey;
  emoji: string;
  cardClass: string;
}[] = [
  {
    key: "students",
    labelKey: "admin_stat_students",
    emoji: "🎓",
    cardClass:
      "bg-primary text-white shadow-xl shadow-primary/30 ring-1 ring-white/10",
  },
  {
    key: "teachers",
    labelKey: "admin_stat_teachers",
    emoji: "👥",
    cardClass:
      "bg-accent text-white shadow-xl shadow-accent/30 ring-1 ring-white/10",
  },
  {
    key: "classes",
    labelKey: "admin_stat_classes",
    emoji: "📋",
    cardClass:
      "bg-neutral-100 text-foreground shadow-xl shadow-neutral-900/5 ring-1 ring-neutral-200/70",
  },
  {
    key: "paidStudents",
    labelKey: "admin_stat_paid_students",
    emoji: "✅",
    cardClass:
      "bg-accent text-white shadow-xl shadow-accent/30 ring-1 ring-white/10",
  },
];

export function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>(() => ({
    students: 0,
    teachers: 0,
    classes: 0,
    paidStudents: 0,
  }));

  const refresh = useCallback(() => {
    setStats(computeStats());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onUsers = () => refresh();
    const onPayments = () => refresh();
    const onClasses = () => refresh();
    window.addEventListener("motiva-users-updated", onUsers);
    window.addEventListener("motiva-student-payments-updated", onPayments);
    window.addEventListener("motiva-classes-updated", onClasses);
    return () => {
      window.removeEventListener("motiva-users-updated", onUsers);
      window.removeEventListener("motiva-student-payments-updated", onPayments);
      window.removeEventListener("motiva-classes-updated", onClasses);
    };
  }, [refresh]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {t("admin_nav_dashboard")}
      </h1>

      <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
        {STAT_CARDS.map(({ key, labelKey, emoji, cardClass }) => (
          <div
            key={key}
            className={`flex flex-col rounded-3xl p-8 sm:p-10 ${cardClass}`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-lg font-semibold leading-snug opacity-95 sm:text-xl">
                {t(labelKey)}
              </p>
              <span
                className="text-5xl leading-none sm:text-6xl"
                aria-hidden
              >
                {emoji}
              </span>
            </div>
            <p className="mt-8 text-5xl font-bold tabular-nums tracking-tight sm:mt-10 sm:text-6xl">
              {stats[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
