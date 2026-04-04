import type { TranslationKey } from "@/lib/i18n";

export type AdminNavItem = {
  href: string;
  labelKey: TranslationKey;
  icon: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
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

/** Longest matching admin route for breadcrumb-style titles. */
export function adminTitleKeyForPath(pathname: string | null): TranslationKey {
  if (!pathname) return "admin_nav_dashboard";
  const sorted = [...ADMIN_NAV_ITEMS].sort(
    (a, b) => b.href.length - a.href.length,
  );
  const hit = sorted.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return hit?.labelKey ?? "admin_nav_dashboard";
}
