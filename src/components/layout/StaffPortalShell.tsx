"use client";

import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { RoleGate } from "@/components/layout/RoleGate";
import type { Role } from "@/lib/roles";

type Props = {
  allow: Role | readonly Role[];
  children: React.ReactNode;
};

export function StaffPortalShell({ allow, children }: Props) {
  return (
    <RoleGate allow={allow}>
      <AuthenticatedHeader />
      <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        {children}
      </div>
    </RoleGate>
  );
}
