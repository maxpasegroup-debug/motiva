"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { countPendingAdmissions } from "@/lib/admissions-store";
import { listClasses } from "@/lib/classes-store";
import type { TranslationKey } from "@/lib/i18n";
import { totalPaidAmount } from "@/lib/payments-ledger-store";
import { listStudents } from "@/lib/students-store";
import { listTeachers } from "@/lib/teachers-store";

type DashboardStats = {
  students: number;
  teachers: number;
  classes: number;
  pendingAdmissions: number;
  paymentsIn: number;
};

function computeStats(): DashboardStats {
  return {
    students: listStudents().length,
    teachers: listTeachers().length,
    classes: listClasses().length,
    pendingAdmissions: countPendingAdmissions(),
    paymentsIn: totalPaidAmount(),
  };
}

const STAT_CARDS: {
  key: keyof DashboardStats;
  labelKey: TranslationKey;
  emoji: string;
  cardClass: string;
  format?: "money";
}[] = [
  {
    key: "students",
    labelKey: "admin_stat_students",
    emoji: "🎓",
    cardClass:
      "bg-primary text-white shadow-xl shadow-primary/30 ring-1 ring-white/10",
  },
  {
    key: "classes",
    labelKey: "admin_stat_classes",
    emoji: "🎯",
    cardClass:
      "bg-neutral-100 text-foreground shadow-xl shadow-neutral-900/5 ring-1 ring-neutral-200/70",
  },
  {
    key: "teachers",
    labelKey: "admin_stat_teachers",
    emoji: "👨‍🏫",
    cardClass:
      "bg-accent text-white shadow-xl shadow-accent/30 ring-1 ring-white/10",
  },
  {
    key: "pendingAdmissions",
    labelKey: "admin_stat_pending_admissions",
    emoji: "⏳",
    cardClass:
      "bg-primary text-white shadow-xl shadow-primary/25 ring-1 ring-white/10",
  },
  {
    key: "paymentsIn",
    labelKey: "admin_stat_payments_in",
    emoji: "💰",
    cardClass:
      "bg-accent text-white shadow-xl shadow-accent/30 ring-1 ring-white/10",
    format: "money",
  },
];

export function AdminDashboardPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>(() => ({
    students: 0,
    teachers: 0,
    classes: 0,
    pendingAdmissions: 0,
    paymentsIn: 0,
  }));

  const refresh = useCallback(() => {
    setStats(computeStats());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onAny = () => refresh();
    window.addEventListener("motiva-users-updated", onAny);
    window.addEventListener("motiva-classes-updated", onAny);
    window.addEventListener("motiva-admissions-updated", onAny);
    window.addEventListener("motiva-payments-ledger-updated", onAny);
    return () => {
      window.removeEventListener("motiva-users-updated", onAny);
      window.removeEventListener("motiva-classes-updated", onAny);
      window.removeEventListener("motiva-admissions-updated", onAny);
      window.removeEventListener("motiva-payments-ledger-updated", onAny);
    };
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
        {STAT_CARDS.map(({ key, labelKey, emoji, cardClass, format }) => (
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
            <p className="mt-8 text-4xl font-bold tabular-nums tracking-tight sm:mt-10 sm:text-5xl">
              {format === "money"
                ? `₹${stats[key].toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                : stats[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
