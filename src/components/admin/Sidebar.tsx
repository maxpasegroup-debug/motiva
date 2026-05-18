"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenCheck,
  ChartNoAxesCombined,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Image,
  IndianRupee,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Presentation,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  getAdminNavigationForRole,
  isAdminPathActive,
  type AdminNavItem,
} from "@/lib/admin-navigation";
import type { Role } from "@/lib/roles";

const icons: Record<string, LucideIcon> = {
  BookOpenCheck,
  ChartNoAxesCombined,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Image,
  IndianRupee,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Presentation,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  Workflow,
};

type SidebarProps = {
  role: Role | null;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
};

function NavItem({
  item,
  collapsed,
  onClose,
}: {
  item: AdminNavItem;
  collapsed: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const Icon = icons[item.icon] ?? LayoutDashboard;
  const active = isAdminPathActive(pathname, item.href);
  const activeChild = item.children?.some((child) => isAdminPathActive(pathname, child.href));

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors ${
        active || activeChild
          ? "bg-neutral-950 text-white"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
      }`}
      title={collapsed ? item.title : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{item.title}</span> : null}
    </Link>
  );
}

export function Sidebar({ role, open, collapsed, onClose }: SidebarProps) {
  const groups = getAdminNavigationForRole(role);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-20" : "md:w-72"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
          <Link href="/admin/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-sm font-semibold text-white">
              M
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-neutral-950">
                  Motivaedus
                </span>
                <span className="block truncate text-xs text-neutral-500">
                  Academy Admin
                </span>
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-2">
            {groups.map((group) => (
              <section key={group.title}>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <NavItem
                      key={item.title}
                      item={item}
                      collapsed={collapsed}
                      onClose={onClose}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </nav>
        {!collapsed ? (
          <div className="border-t border-neutral-200 px-4 py-4">
            <p className="text-xs leading-5 text-neutral-500">
              Use search for course, report, website, and settings pages.
            </p>
          </div>
        ) : null}
      </aside>
    </>
  );
}
