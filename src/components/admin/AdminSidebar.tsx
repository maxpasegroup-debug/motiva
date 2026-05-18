"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/components/admin/admin-nav-config";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-b border-neutral-200 bg-white md:w-60 md:border-b-0 md:border-r lg:w-64">
      <nav className="flex flex-col gap-2 p-4 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto md:py-6 md:pl-4 md:pr-3 lg:pl-6">
        {ADMIN_NAV_ITEMS.map(({ href, label, icon, description }) => {
          const active =
            pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[3.5rem] items-center gap-4 rounded-xl px-4 py-3 text-left text-base font-semibold transition-colors ${
                active
                  ? "bg-primary text-white shadow-md"
                  : "text-foreground hover:bg-neutral-100"
              }`}
            >
              <span className="text-3xl leading-none" aria-hidden>
                {icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate">{label}</span>
                <span className="mt-0.5 block line-clamp-2 text-xs font-normal opacity-75">
                  {description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
