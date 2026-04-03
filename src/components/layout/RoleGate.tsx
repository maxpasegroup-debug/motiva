"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRoleHome, type Role } from "@/lib/roles";
import { getSession } from "@/lib/session";

type Props = {
  allow: Role;
  children: React.ReactNode;
};

export function RoleGate({ allow, children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/login");
      return;
    }
    if (s.role !== allow) {
      router.replace(getRoleHome(s.role));
      return;
    }
    setReady(true);
  }, [router, allow]);

  if (!ready) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center text-neutral-400"
        aria-busy="true"
      >
        …
      </div>
    );
  }

  return <>{children}</>;
}
