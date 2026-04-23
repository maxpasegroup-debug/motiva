"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  notificationIds: string[];
  isRead?: boolean;
  markAll?: boolean;
};

export function ParentNotificationActions({
  notificationIds,
  isRead = false,
  markAll = false,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    if (!markAll && isRead) {
      return;
    }

    setSaving(true);
    await fetch("/api/parent/notifications", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        markAll ? { markAllRead: true } : { notificationIds },
      ),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving || (!markAll && isRead)}
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-50"
    >
      {saving ? "Saving..." : markAll ? "Mark all as read" : isRead ? "Read" : "Mark as read"}
    </button>
  );
}
