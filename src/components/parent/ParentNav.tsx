"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/parent", label: "Dashboard" },
  { href: "/parent/child-progress", label: "Child Progress" },
  { href: "/parent/learning-report", label: "Learning Report" },
  { href: "/parent/notifications", label: "Notifications" },
];

export function ParentNav() {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto rounded-lg border border-neutral-200 bg-white p-2 shadow-sm">
      <div className="flex min-w-max gap-2 sm:grid sm:min-w-0 sm:grid-cols-4">
        {LINKS.map((link) => {
          const isActive =
            pathname === link.href || pathname?.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-11 min-w-[8.5rem] items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold sm:min-w-0 ${
                isActive
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
