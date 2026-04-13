"use client";

import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { RoleGate } from "@/components/layout/RoleGate";

export function ParentShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={["parent", "admin"]}>
      <div className="flex w-full flex-1 flex-col">
        <AuthenticatedHeader />
        {children}
      </div>
    </RoleGate>
  );
}
