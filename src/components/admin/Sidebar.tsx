"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  getAdminNavigationForRole,
  isAdminPathActive,
  type AdminNavItem,
} from "@/lib/admin-navigation";
import type { Role } from "@/lib/roles";

type SidebarProps = {
  role: Role | null;
  open: boolean;
  collapsed: boolean;
  onClose: () => void;
};

function DesktopNavItem({
  item,
  collapsed,
  onClose,
}: {
  item: AdminNavItem;
  collapsed: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const active = isAdminPathActive(pathname, item.href);
  const activeChild = item.children?.some((child) => isAdminPathActive(pathname, child.href));

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`flex min-h-14 gap-3 border-l-4 px-3 py-3 transition-colors ${
        active || activeChild
          ? "border-blue-600 bg-blue-50 text-blue-900"
          : "border-transparent text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
      } ${collapsed ? "items-center justify-center rounded-lg" : "rounded-r-lg"}`}
      title={collapsed ? item.title : undefined}
    >
      <span className="text-2xl leading-none" aria-hidden>
        {item.icon}
      </span>
      {!collapsed ? (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{item.title}</span>
          <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-neutral-500">
            {item.description}
          </span>
        </span>
      ) : null}
    </Link>
  );
}

function MobileNavItem({
  item,
  active,
  onClick,
}: {
  item: AdminNavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const label =
    item.title === "All Students"
      ? "Students"
      : item.title === "Recorded Courses"
        ? "Courses"
        : item.title;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-center text-[11px] font-semibold ${
        active ? "bg-blue-50 text-blue-700" : "text-neutral-600"
      }`}
    >
      <span className="text-xl leading-none" aria-hidden>
        {item.icon}
      </span>
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

export function Sidebar({ role, open, collapsed, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const groups = getAdminNavigationForRole(role);
  const items = groups.flatMap((group) => group.items);
  const bottomLabels = new Set(["Home", "Admissions", "All Students", "Recorded Courses"]);
  const bottomItems = items.filter((item) => bottomLabels.has(item.title));
  const moreItems = items.filter((item) => !bottomLabels.has(item.title));
  const moreActive = moreItems.some((item) => isAdminPathActive(pathname, item.href));

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
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-neutral-200 bg-white transition-transform duration-200 md:sticky md:top-0 md:flex md:h-screen ${
          collapsed ? "md:w-20" : "md:w-[260px]"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
          <Link href="/admin" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-sm font-semibold text-white">
              M
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-neutral-950">
                  Motivaedus
                </span>
                <span className="block truncate text-xs text-neutral-500">
                  Simple Admin
                </span>
              </span>
            ) : null}
          </Link>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {groups.map((group) => (
              <section key={group.title}>
                {!collapsed ? (
                  <h2 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    {group.title}
                  </h2>
                ) : null}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <DesktopNavItem
                      key={item.href}
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
      </aside>

      {open ? (
        <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-white shadow-xl md:hidden">
          <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
            <span className="text-sm font-semibold text-neutral-950">Motivaedus Admin</span>
            <button
              type="button"
              aria-label="Close navigation"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
              onClick={onClose}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <nav className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="space-y-5">
              {groups.map((group) => (
                <section key={group.title}>
                  <h2 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    {group.title}
                  </h2>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <DesktopNavItem
                        key={item.href}
                        item={item}
                        collapsed={false}
                        onClose={onClose}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </nav>
        </aside>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 px-2 py-2 shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.35)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md gap-1">
          {bottomItems.map((item) => (
            <MobileNavItem
              key={item.href}
              item={item}
              active={isAdminPathActive(pathname, item.href)}
            />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 text-center text-[11px] font-semibold ${
              moreActive ? "bg-blue-50 text-blue-700" : "text-neutral-600"
            }`}
          >
            <span className="text-xl leading-none" aria-hidden>
              ⋯
            </span>
            <span>More</span>
          </button>
        </div>
      </nav>

      {moreOpen ? (
        <div className="fixed inset-0 z-50 bg-black/35 md:hidden">
          <button
            type="button"
            aria-label="Close more menu"
            className="absolute inset-0"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-950">More</h2>
              <button
                type="button"
                aria-label="Close more menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                onClick={() => setMoreOpen(false)}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="grid gap-2">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex min-h-14 items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                >
                  <span className="text-2xl" aria-hidden>
                    {item.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-neutral-950">
                      {item.title}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {item.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
