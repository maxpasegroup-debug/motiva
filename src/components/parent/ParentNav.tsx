"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/parent", label: "Home" },
  { href: "/parent/child-progress", label: "Progress" },
  { href: "/parent/learning-report", label: "Report" },
  { href: "/parent/notifications", label: "Alerts" },
];

export function ParentNav() {
  const pathname = usePathname();

  return (
    <nav className="rounded-lg border border-neutral-200 bg-white p-2 shadow-sm">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {LINKS.map((link) => {
          const isActive =
            pathname === link.href || pathname?.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-12 items-center justify-center rounded-lg px-3 py-3 text-center text-sm font-semibold ${
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
