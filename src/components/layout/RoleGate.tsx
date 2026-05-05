"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRoleHome, isRole, type Role } from "@/lib/roles";

type Props = {
  allow: Role | readonly Role[];
  children: React.ReactNode;
};

type MeResponse = {
  userId: string;
  role: Role;
  name: string;
  mobile: string | null;
};

export function RoleGate({ allow, children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      if (cancelled) return;

      if (!res.ok) {
        router.replace("/login");
        return;
      }

      const session = (await res.json().catch(() => null)) as MeResponse | null;
      if (!session || !isRole(session.role)) {
        router.replace("/login");
        return;
      }

      const allowed = Array.isArray(allow) ? allow : [allow];
      if (!allowed.includes(session.role)) {
        router.replace(getRoleHome(session.role));
        return;
      }

      setReady(true);
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router, allow]);

  if (!ready) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center text-neutral-400"
        aria-busy="true"
      >
        ...
      </div>
    );
  }

  return <>{children}</>;
}
