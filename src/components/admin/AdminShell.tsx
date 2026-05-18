"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { RoleGate } from "@/components/layout/RoleGate";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";
import { getSession } from "@/lib/session";
import type { Role } from "@/lib/roles";

type AdminShellProps = {
  children: ReactNode;
};

const allowedRoles: Role[] = [
  "admin",
  "telecounselor",
  "demo_executive",
  "administrative_officer",
  "manager",
  "academic_coordinator",
  "hr",
  "mentor",
  "teacher",
];

export function AdminShell({ children }: AdminShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [displayName, setDisplayName] = useState("Admin");
  const [role, setRole] = useState<Role | null>("admin");

  useEffect(() => {
    const session = getSession();
    setDisplayName(session?.name || session?.email || "Admin");
    setRole(session?.role ?? "admin");
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("motiva-admin-sidebar-collapsed");
    setCollapsed(saved === "true");
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      window.localStorage.setItem("motiva-admin-sidebar-collapsed", String(!current));
      return !current;
    });
  }

  return (
    <RoleGate allow={allowedRoles}>
      <div className="flex min-h-screen bg-neutral-50 text-neutral-950">
        <Sidebar
          role={role}
          open={mobileOpen}
          collapsed={collapsed}
          onClose={() => setMobileOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            displayName={displayName}
            role={role}
            collapsed={collapsed}
            onMenu={() => setMobileOpen(true)}
            onToggleCollapsed={toggleCollapsed}
          />
          <main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-5 lg:px-8">{children}</main>
        </div>
      </div>
    </RoleGate>
  );
}
