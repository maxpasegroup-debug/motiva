"use client";

import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { RoleGate } from "@/components/layout/RoleGate";

export function TeacherShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate allow="teacher">
      <AuthenticatedHeader />
      {children}
    </RoleGate>
  );
}
