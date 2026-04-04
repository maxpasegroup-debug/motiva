"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  adminTitleKeyForPath,
} from "@/components/admin/admin-nav-config";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import {
  clearSession,
  getAuthToken,
  getSession,
} from "@/lib/session";
import { setUsersMirror, type UserRecord } from "@/lib/users-store";

function profileInitials(name: string, email: string): string {
  const n = name.trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const e = email.trim();
  return e.length >= 2 ? e.slice(0, 2).toUpperCase() : "A";
}

export function AdminHeader() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const titleKey = useMemo(() => adminTitleKeyForPath(pathname), [pathname]);
  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const s = getSession();
    setEmail(s?.email ?? "");
    setDisplayName(s?.name?.trim() || s?.email || "");

    const token = getAuthToken();
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`/api/users?role=teacher`, { headers }),
      fetch(`/api/users?role=student`, { headers }),
      fetch(`/api/users?role=parent`, { headers }),
    ])
      .then(async ([tRes, sRes, pRes]) => {
        if (!tRes.ok || !sRes.ok) return;
        const tJson = (await tRes.json()) as { users: UserRecord[] };
        const sJson = (await sRes.json()) as { users: UserRecord[] };
        const pJson = pRes.ok
          ? ((await pRes.json()) as { users: UserRecord[] })
          : { users: [] as UserRecord[] };
        setUsersMirror([
          ...(tJson.users ?? []),
          ...(sJson.users ?? []),
          ...(pJson.users ?? []),
        ]);
      })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    clearSession();
    router.push("/");
  }

  const initials = profileInitials(displayName, email);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b border-neutral-200 bg-white px-6">
      <div className="flex w-full min-w-0 items-center justify-between gap-4">
        <h1 className="truncate text-xl font-semibold text-gray-800">
          {t(titleKey)}
        </h1>

        <div className="flex shrink-0 items-center gap-4">
          <LanguageToggle variant="compact" />
          <div className="flex min-w-0 items-center gap-2 border-l border-neutral-200 pl-4">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-gray-700"
              aria-hidden
            >
              {initials}
            </span>
            <span className="hidden max-w-[10rem] truncate text-sm text-gray-700 sm:inline">
              {displayName || email || "—"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 text-sm text-red-500 underline-offset-2 hover:underline"
          >
            {t("admin_nav_logout")}
          </button>
        </div>
      </div>
    </header>
  );
}
