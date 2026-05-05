"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";

type AdminUser = {
  id: string;
  name: string;
  mobile: string | null;
  role: string;
  isActive: boolean;
  pinResetRequired: boolean;
};

function cleanPin(value: string) {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function AdminSettingsPage() {
  const { t } = useLanguage();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [savingOwnPin, setSavingOwnPin] = useState(false);
  const [ownMessage, setOwnMessage] = useState<string | null>(null);
  const [ownError, setOwnError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [accountPin, setAccountPin] = useState("");
  const [accountConfirmPin, setAccountConfirmPin] = useState("");
  const [requireReset, setRequireReset] = useState(false);
  const [savingAccountPin, setSavingAccountPin] = useState(false);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users],
  );

  async function loadUsers() {
    setLoadingUsers(true);
    const res = await fetch("/api/admin/users", { credentials: "include" });
    const json = (await res.json().catch(() => ({}))) as { users?: AdminUser[] };
    setLoadingUsers(false);

    if (!res.ok) {
      setAccountError("Could not load accounts.");
      return;
    }

    const nextUsers = json.users ?? [];
    setUsers(nextUsers);
    setSelectedUserId((current) => current || nextUsers[0]?.id || "");
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handlePinChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOwnError(null);
    setOwnMessage(null);

    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      setOwnError("PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setOwnError("New PIN and confirmation do not match.");
      return;
    }

    setSavingOwnPin(true);
    const res = await fetch("/api/admin/change-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ currentPin, newPin, confirmPin }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setSavingOwnPin(false);

    if (!res.ok) {
      setOwnError(json.error ?? "Could not update PIN.");
      return;
    }

    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setOwnMessage("Admin PIN updated successfully.");
  }

  async function handleAccountPinReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountError(null);
    setAccountMessage(null);

    if (!selectedUserId) {
      setAccountError("Choose an account first.");
      return;
    }
    if (!/^\d{4}$/.test(accountPin) || accountPin !== accountConfirmPin) {
      setAccountError("New PIN and confirmation must be 4 matching digits.");
      return;
    }

    setSavingAccountPin(true);
    const res = await fetch(`/api/admin/users/${selectedUserId}/reset-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        pin: accountPin,
        confirmPin: accountConfirmPin,
        requireReset,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    setSavingAccountPin(false);

    if (!res.ok) {
      setAccountError(json.error ?? "Could not reset account PIN.");
      return;
    }

    setAccountPin("");
    setAccountConfirmPin("");
    setRequireReset(false);
    setAccountMessage("Account PIN reset successfully.");
    await loadUsers();
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-lg text-neutral-600">{t("admin_settings_sub")}</p>
      </div>

      <Card className="border-2 border-neutral-200/80 p-8">
        <p className="text-lg leading-relaxed text-neutral-700">
          Admin authentication is now mobile number plus 4-digit PIN. Email is not
          used for login.
        </p>
        <p className="mt-6 text-base text-neutral-600">
          Default admin access: mobile 9946930723, PIN 1234. Change this PIN after
          first login.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="border-2 border-primary/15 p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-foreground">Reset Admin PIN</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Change the PIN for the currently logged-in admin account.
          </p>

          <form onSubmit={handlePinChange} className="mt-6 grid gap-4">
            <label className="block text-sm font-medium text-neutral-700">
              <span className="mb-2 block">Current PIN</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={currentPin}
                onChange={(event) => setCurrentPin(cleanPin(event.target.value))}
                className="min-h-12 w-full rounded-lg border border-neutral-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                onChange={(event) => setNewPin(cleanPin(event.target.value))}
                className="min-h-12 w-full rounded-lg border border-neutral-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                onChange={(event) => setConfirmPin(cleanPin(event.target.value))}
                className="min-h-12 w-full rounded-lg border border-neutral-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>

            {ownError ? <p className="text-sm font-medium text-red-600">{ownError}</p> : null}
            {ownMessage ? (
              <p className="text-sm font-medium text-emerald-700">{ownMessage}</p>
            ) : null}

            <button
              type="submit"
              disabled={savingOwnPin}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingOwnPin ? "Updating..." : "Update PIN"}
            </button>
          </form>
        </Card>

        <Card className="border-2 border-neutral-200/80 p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-foreground">Reset Account PIN</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Admin can reset the PIN for students, parents, teachers, mentors, and
            staff accounts.
          </p>

          <form onSubmit={handleAccountPinReset} className="mt-6 grid gap-4">
            <label className="block text-sm font-medium text-neutral-700">
              <span className="mb-2 block">Account</span>
              <select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-neutral-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                disabled={loadingUsers}
                required
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role} - {user.mobile ?? "no mobile"}
                  </option>
                ))}
              </select>
            </label>

            {selectedUser ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                <p className="font-semibold text-foreground">{selectedUser.name}</p>
                <p>Mobile: {selectedUser.mobile ?? "Not set"}</p>
                <p>Role: {selectedUser.role}</p>
                <p>Status: {selectedUser.isActive ? "Active" : "Inactive"}</p>
              </div>
            ) : null}

            <label className="block text-sm font-medium text-neutral-700">
              <span className="mb-2 block">New PIN</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={accountPin}
                onChange={(event) => setAccountPin(cleanPin(event.target.value))}
                className="min-h-12 w-full rounded-lg border border-neutral-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>
            <label className="block text-sm font-medium text-neutral-700">
              <span className="mb-2 block">Confirm PIN</span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={accountConfirmPin}
                onChange={(event) => setAccountConfirmPin(cleanPin(event.target.value))}
                className="min-h-12 w-full rounded-lg border border-neutral-300 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                required
              />
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={requireReset}
                onChange={(event) => setRequireReset(event.target.checked)}
                className="size-4 rounded border-neutral-300 text-primary"
              />
              Ask user to set a fresh PIN after login
            </label>

            {accountError ? (
              <p className="text-sm font-medium text-red-600">{accountError}</p>
            ) : null}
            {accountMessage ? (
              <p className="text-sm font-medium text-emerald-700">{accountMessage}</p>
            ) : null}

            <button
              type="submit"
              disabled={savingAccountPin || loadingUsers}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingAccountPin ? "Resetting..." : "Reset Selected Account PIN"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
