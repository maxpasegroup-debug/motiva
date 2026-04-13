"use client";

import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { RoleGate } from "@/components/layout/RoleGate";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow={["student", "admin"]}>
      <AuthenticatedHeader />
      {children}
    </RoleGate>
  );
}
