"use client";

import { RoleGate } from "@/components/layout/RoleGate";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow="admin">
      <div className="flex w-full min-h-0 flex-1 flex-col">{children}</div>
    </RoleGate>
  );
}
