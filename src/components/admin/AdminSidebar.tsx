"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { clearSession } from "@/lib/session";
import type { TranslationKey } from "@/lib/i18n";

const NAV: {
  href: string;
  labelKey: TranslationKey;
  icon: string;
}[] = [
  { href: "/admin/dashboard", labelKey: "admin_nav_dashboard", icon: "📊" },
  { href: "/admin/admissions", labelKey: "admin_nav_admissions", icon: "📥" },
  { href: "/admin/students", labelKey: "admin_nav_students", icon: "🎓" },
  { href: "/admin/parents", labelKey: "admin_nav_parents", icon: "👨‍👩‍👧" },
  { href: "/admin/teachers", labelKey: "admin_nav_teachers", icon: "👨‍🏫" },
  { href: "/admin/batches", labelKey: "admin_nav_batches", icon: "🏫" },
  { href: "/admin/courses", labelKey: "admin_nav_courses", icon: "📚" },
  { href: "/admin/programs", labelKey: "admin_nav_programs", icon: "🎯" },
  { href: "/admin/payments", labelKey: "admin_nav_payments", icon: "💳" },
  { href: "/admin/reports", labelKey: "admin_nav_reports", icon: "📊" },
  { href: "/admin/settings", labelKey: "admin_nav_settings", icon: "⚙️" },
];

export function AdminSidebar() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-full shrink-0 border-b border-neutral-200 bg-white md:w-60 md:border-b-0 md:border-r lg:w-64">
      <nav className="flex flex-col gap-2 p-4 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto md:py-6 md:pl-4 md:pr-3 lg:pl-6">
        {NAV.map(({ href, labelKey, icon }) => {
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
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={async () => {
            await fetch("/api/admin/logout", {
              method: "POST",
              credentials: "include",
            });
            clearSession();
            router.push("/");
          }}
          className="mt-4 flex min-h-[3.5rem] items-center gap-4 rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-left text-base font-semibold text-neutral-700 transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
        >
          <span className="text-3xl leading-none" aria-hidden>
            🚪
          </span>
          <span>{t("admin_nav_logout")}</span>
        </button>
      </nav>
    </aside>
  );
}
