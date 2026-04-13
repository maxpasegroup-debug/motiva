"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";
import { getAuthToken, getSession } from "@/lib/session";
import { setUsersMirror, type UserRecord } from "@/lib/users-store";

export function AuthenticatedHeader() {
  const { t } = useLanguage();
  const [identity, setIdentity] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    setIdentity(s?.email ?? null);

    const token = getAuthToken();
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    if (s?.role === "admin") {
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
      return;
    }

    if (s?.role === "teacher") {
      void fetch(`/api/teacher/directory`, { headers })
        .then(async (res) => {
          if (!res.ok) return;
          const json = (await res.json()) as { users?: UserRecord[] };
          setUsersMirror(json.users ?? []);
        })
        .catch(() => {});
    }
  }, []);

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 shadow-md shadow-neutral-900/8 backdrop-blur">
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex min-h-[3.5rem] flex-wrap items-center justify-between gap-3 sm:min-h-[3.75rem]">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground sm:text-xl">
              {t("welcome")}
            </p>
            {identity ? (
              <p className="mt-0.5 truncate text-sm text-neutral-500">
                {identity}
              </p>
            ) : null}
          </div>
          <LanguageToggle />
        </div>
        <RoleSwitcher />
      </div>
    </header>
  );
}
