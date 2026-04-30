"use client";

import { FormEvent, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { getAuthToken } from "@/lib/session";

export function AdminSettingsPage() {
  const { t } = useLanguage();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePinChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setError("New PIN and confirmation do not match.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError("Unauthorized");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/change-pin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPin, newPin, confirmPin }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Could not update PIN.");
      return;
    }

    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setMessage("Admin PIN updated successfully.");
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-lg text-neutral-600">{t("admin_settings_sub")}</p>
      </div>
      <Card className="border-2 border-neutral-200/80 p-8">
        <p className="text-lg leading-relaxed text-neutral-700">
          {t("admin_settings_password_hint")}
        </p>
        <p className="mt-6 text-base text-neutral-600">{t("admin_settings_admin_boot")}</p>
      </Card>

      <Card className="border-2 border-primary/15 p-6 shadow-sm sm:p-8">
        <h2 className="text-xl font-bold text-foreground">Reset Admin PIN</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Use this to change the PIN for the currently logged-in admin account.
        </p>

        <form onSubmit={handlePinChange} className="mt-6 grid gap-4 sm:max-w-md">
          <label className="block text-sm font-medium text-neutral-700">
            <span className="mb-2 block">Current PIN</span>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={currentPin}
              onChange={(event) =>
                setCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="min-h-12 w-full rounded-xl border border-neutral-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            <span className="mb-2 block">New PIN</span>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(event) =>
                setNewPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="min-h-12 w-full rounded-xl border border-neutral-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </label>
          <label className="block text-sm font-medium text-neutral-700">
            <span className="mb-2 block">Confirm New PIN</span>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(event) =>
                setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="min-h-12 w-full rounded-xl border border-neutral-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </label>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          {message ? (
            <p className="text-sm font-medium text-emerald-700">{message}</p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Updating..." : "Update PIN"}
          </button>
        </form>
      </Card>
    </div>
  );
}
