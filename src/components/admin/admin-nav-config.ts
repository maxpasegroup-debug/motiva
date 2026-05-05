import type { TranslationKey } from "@/lib/i18n";

export type AdminNavItem = {
  href: string;
  labelKey: TranslationKey;
  icon: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: "/admin/dashboard", labelKey: "admin_nav_dashboard", icon: "Chart" },
  { href: "/admin/admissions", labelKey: "admin_nav_admissions", icon: "In" },
  {
    href: "/admin/admissions/remedial",
    labelKey: "admin_nav_remedial_admission",
    icon: "Med",
  },
  {
    href: "/admin/admissions/create-account",
    labelKey: "admin_nav_create_account",
    icon: "Key",
  },
  { href: "/admin/users", labelKey: "admin_nav_users", icon: "Users" },
  { href: "/admin/students", labelKey: "admin_nav_students", icon: "Stu" },
  { href: "/admin/parents", labelKey: "admin_nav_parents", icon: "Par" },
  { href: "/admin/teachers", labelKey: "admin_nav_teachers", icon: "Teach" },
  { href: "/admin/batches", labelKey: "admin_nav_batches", icon: "Batch" },
  { href: "/admin/programs", labelKey: "admin_nav_programs", icon: "Prog" },
  { href: "/admin/courses", labelKey: "admin_nav_courses", icon: "Course" },
  { href: "/admin/enquiries", labelKey: "admin_nav_enquiries", icon: "Mail" },
  { href: "/admin/payments", labelKey: "admin_nav_payments", icon: "Pay" },
  { href: "/admin/reports", labelKey: "admin_nav_reports", icon: "Rpt" },
  { href: "/admin/settings", labelKey: "admin_nav_settings", icon: "Set" },
];

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
