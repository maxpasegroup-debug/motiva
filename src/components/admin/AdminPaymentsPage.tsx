"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  listPaymentEntries,
  setPaymentEntryStatus,
  type PaymentLedgerEntry,
} from "@/lib/payments-ledger-store";
import { setStudentPaymentStatus } from "@/lib/student-payments-store";
import { getAuthToken } from "@/lib/session";

export function AdminPaymentsPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<PaymentLedgerEntry[]>([]);

  const refresh = useCallback(() => {
    setRows(listPaymentEntries());
  }, []);

  useEffect(() => {
    refresh();
    const ev = () => refresh();
    window.addEventListener("motiva-payments-ledger-updated", ev);
    return () =>
      window.removeEventListener("motiva-payments-ledger-updated", ev);
  }, [refresh]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-lg text-neutral-600">{t("admin_payments_sub")}</p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white py-12 text-center text-neutral-500">
          {t("admin_payments_empty")}
        </p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id}>
              <Card className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                <div className="text-left">
                  <p className="text-lg font-bold text-foreground">
                    {r.studentName}
                  </p>
                  <p className="text-neutral-600">{r.courseLabel}</p>
                  <p className="mt-2 text-xl font-bold tabular-nums">
                    ₹{r.amount.toLocaleString("en-IN")}
                  </p>
                  <p
                    className={`mt-1 text-sm font-semibold ${
                      r.status === "paid" ? "text-primary" : "text-accent"
                    }`}
                  >
                    {r.status === "paid" ? "✅ Paid" : "❌ Pending"}
                  </p>
                </div>
                {r.status === "pending" ? (
                  <Button
                    type="button"
                    onClick={() => {
                      setPaymentEntryStatus(r.id, "paid");
                      setStudentPaymentStatus(r.studentId, "paid");
                      const tok = getAuthToken();
                      if (tok) {
                        void fetch(
                          `/api/admin/students/${encodeURIComponent(r.studentId)}/payment-status`,
                          {
                            method: "PATCH",
                            headers: {
                              Authorization: `Bearer ${tok}`,
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({ status: "paid" }),
                          },
                        );
                      }
                      refresh();
                    }}
                    className="min-h-14 w-full shrink-0 text-lg md:w-auto md:min-w-[12rem]"
                  >
                    {t("admin_payments_mark_paid")}
                  </Button>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
