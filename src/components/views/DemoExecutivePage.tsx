"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAuthToken } from "@/lib/session";

type DemoRow = {
  id: string;
  lead_id: string;
  demo_executive_id: string;
  status: "pending" | "completed";
  result: "interested" | "not_interested" | null;
  notes: string | null;
};

export function DemoExecutivePage() {
  const { t } = useLanguage();
  const token = getAuthToken();
  const [demos, setDemos] = useState<DemoRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch("/api/demos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = (await res.json().catch(() => ({}))) as {
        demos?: DemoRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(j.error ?? t("demos_load_error"));
        return;
      }
      setDemos(j.demos ?? []);
    } catch {
      setError(t("demos_load_error"));
    }
  }, [token, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function complete(
    id: string,
    result: "interested" | "not_interested",
  ) {
    if (!token) return;
    const notes = notesById[id]?.trim() || null;
    const res = await fetch(`/api/demos/${id}/complete`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ result, notes }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? t("demos_complete_error"));
      return;
    }
    await refresh();
  }

  if (!token) {
    return (
      <p className="text-center text-neutral-600">{t("demos_need_login")}</p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 px-4 py-8">
      <h1 className="text-2xl font-bold">{t("demos_title")}</h1>
      {error ? (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="space-y-4">
        {demos.map((d) => (
          <li key={d.id}>
            <Card className="p-4 shadow-md">
              <p className="text-sm text-neutral-600">
                {t("demos_lead_label")}: {d.lead_id.slice(0, 8)}…
              </p>
              <p className="font-semibold capitalize">{d.status}</p>
              {d.status === "pending" ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    className="min-h-20 w-full rounded-lg border border-neutral-300 p-2 text-sm"
                    placeholder={t("demos_notes_placeholder")}
                    value={notesById[d.id] ?? ""}
                    onChange={(e) =>
                      setNotesById((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      className="min-h-11 flex-1"
                      onClick={() => void complete(d.id, "interested")}
                    >
                      {t("demos_interested")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 flex-1"
                      onClick={() => void complete(d.id, "not_interested")}
                    >
                      {t("demos_not_interested")}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-neutral-600">
                  {d.result ?? "—"}
                  {d.notes ? ` · ${d.notes}` : ""}
                </p>
              )}
            </Card>
          </li>
        ))}
      </ul>
      {demos.length === 0 ? (
        <p className="text-center text-neutral-500">{t("demos_empty")}</p>
      ) : null}
    </div>
  );
}
