"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/mentor", label: "Dashboard" },
  { href: "/mentor/students", label: "My Students" },
  { href: "/mentor/issues", label: "Issues" },
  { href: "/mentor/schedule", label: "Schedule" },
];

export function MentorNav() {
  const pathname = usePathname();

  return (
    <nav className="rounded-3xl border border-neutral-200 bg-white p-2 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-4">
        {LINKS.map((link) => {
          const isActive =
            pathname === link.href || pathname?.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
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
