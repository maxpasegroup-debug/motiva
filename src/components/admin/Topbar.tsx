"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from "lucide-react";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { clearSession } from "@/lib/session";
import { findAdminNavTitle } from "@/lib/admin-navigation";
import type { Role } from "@/lib/roles";

type TopbarProps = {
  displayName: string;
  role: Role | null;
  collapsed: boolean;
  onMenu: () => void;
  onToggleCollapsed: () => void;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] ?? "A").slice(0, 2).toUpperCase();
}

export function Topbar({
  displayName,
  role,
  collapsed,
  onMenu,
  onToggleCollapsed,
}: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const title = useMemo(() => findAdminNavTitle(pathname), [pathname]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    clearSession();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Toggle collapsed sidebar"
          onClick={onToggleCollapsed}
          className="hidden h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 md:inline-flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" aria-hidden />
          ) : (
            <PanelLeftClose className="h-5 w-5" aria-hidden />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-neutral-950">{title}</h1>
          <p className="mt-0.5 hidden truncate text-xs text-neutral-500 sm:block">
            Simple daily management for Motiva
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="hidden min-w-[18rem] max-w-md flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-100 lg:flex"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">Search admin pages...</span>
        </button>

        <NotificationBell />
        <div className="hidden items-center gap-3 border-l border-neutral-200 pl-4 sm:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">
            {initials(displayName)}
          </span>
          <span className="min-w-0">
            <span className="block max-w-36 truncate text-sm font-medium text-neutral-950">
              {displayName || "Admin"}
            </span>
            <span className="block text-xs capitalize text-neutral-500">
              {(role ?? "admin").replace(/_/g, " ")}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Log out"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </header>
  );
}
