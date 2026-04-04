"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { countPendingAdmissions } from "@/lib/admissions-store";
import { totalPaidAmount } from "@/lib/payments-ledger-store";
import { listStudents } from "@/lib/students-store";
import { getAuthToken } from "@/lib/session";

export function AdminReportsPage() {
  const { t } = useLanguage();
  const [snapshot, setSnapshot] = useState({
    students: 0,
    batches: 0,
    pending: 0,
    paidIn: 0,
  });

  const refresh = useCallback(async () => {
    const token = getAuthToken();
    let batches = 0;
    if (token) {
      try {
        const res = await fetch("/api/admin/batches", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const j = (await res.json()) as { batches?: unknown[] };
          batches = j.batches?.length ?? 0;
        }
      } catch {
        /* keep 0 */
      }
    }
    setSnapshot({
      students: listStudents().length,
      batches,
      pending: countPendingAdmissions(),
      paidIn: totalPaidAmount(),
    });
  }, []);

  useEffect(() => {
    void refresh();
    const ev = () => void refresh();
    window.addEventListener("motiva-users-updated", ev);
    window.addEventListener("motiva-classes-updated", ev);
    window.addEventListener("motiva-admissions-updated", ev);
    window.addEventListener("motiva-payments-ledger-updated", ev);
    return () => {
      window.removeEventListener("motiva-users-updated", ev);
      window.removeEventListener("motiva-classes-updated", ev);
      window.removeEventListener("motiva-admissions-updated", ev);
      window.removeEventListener("motiva-payments-ledger-updated", ev);
    };
  }, [refresh]);

  const lines = [
    { labelKey: "admin_stat_students" as const, value: snapshot.students },
    { labelKey: "admin_stat_classes" as const, value: snapshot.batches },
    { labelKey: "admin_stat_pending_admissions" as const, value: snapshot.pending },
    {
      labelKey: "admin_stat_payments_in" as const,
      value: `₹${snapshot.paidIn.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-lg text-neutral-600">{t("admin_reports_sub")}</p>
      </div>
      <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-md">
        <ul className="divide-y divide-neutral-100">
          {lines.map((line) => (
            <li
              key={line.labelKey}
              className="flex items-center justify-between py-5 text-lg first:pt-0 last:pb-0"
            >
              <span className="font-medium text-neutral-700">
                {t(line.labelKey)}
              </span>
              <span className="text-2xl font-bold tabular-nums text-foreground">
                {line.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
