"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

const notifications = [
  "Review pending admissions",
  "Check fee collection follow-ups",
  "Confirm today\'s batch attendance",
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
      >
        <Bell className="h-5 w-5" aria-hidden />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
      </button>
      {open ? (
        <div className="fixed left-3 right-3 top-16 z-50 rounded-lg border border-neutral-200 bg-white p-2 shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-72">
          <div className="px-3 py-2 text-sm font-semibold text-neutral-950">Notifications</div>
          <div className="space-y-1">
            {notifications.map((notification) => (
              <div
                key={notification}
                className="rounded-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                {notification}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
