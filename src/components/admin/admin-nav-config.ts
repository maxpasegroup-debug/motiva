export type AdminNavSection =
  | "main"
  | "students"
  | "classes"
  | "courses"
  | "staff"
  | "reports"
  | "settings";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  description: string;
  section: AdminNavSection;
  sectionLabel: string;
  badgeKey?: "enquiries";
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: "Home",
    href: "/admin",
    icon: "🏠",
    description: "Today's summary - students, payments, enquiries",
    section: "main",
    sectionLabel: "Main",
  },
  {
    label: "Enquiries",
    href: "/admin/enquiries",
    icon: "📋",
    description: "People who asked about joining",
    section: "students",
    sectionLabel: "Students & Admissions",
    badgeKey: "enquiries",
  },
  {
    label: "Admissions",
    href: "/admin/admissions",
    icon: "🧑‍🎓",
    description: "Add new student, create login",
    section: "students",
    sectionLabel: "Students & Admissions",
  },
  {
    label: "All Students",
    href: "/admin/students",
    icon: "👨‍👩‍👧",
    description: "View, search, manage students",
    section: "students",
    sectionLabel: "Students & Admissions",
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: "💳",
    description: "Fee collection and payment status",
    section: "students",
    sectionLabel: "Students & Admissions",
  },
  {
    label: "Batches",
    href: "/admin/batches",
    icon: "📅",
    description: "Class groups and schedules",
    section: "classes",
    sectionLabel: "Classes & Teaching",
  },
  {
    label: "Attendance",
    href: "/admin/attendance",
    icon: "✅",
    description: "Daily attendance reports",
    section: "classes",
    sectionLabel: "Classes & Teaching",
  },
  {
    label: "Teachers",
    href: "/admin/teachers",
    icon: "👨‍🏫",
    description: "Add or remove teachers",
    section: "classes",
    sectionLabel: "Classes & Teaching",
  },
  {
    label: "Recorded Courses",
    href: "/admin/courses",
    icon: "🎬",
    description: "Upload and manage video courses",
    section: "courses",
    sectionLabel: "Courses",
  },
  {
    label: "Staff Logins",
    href: "/admin/users",
    icon: "👥",
    description: "Add staff, reset PIN, turn off access",
    section: "staff",
    sectionLabel: "Staff & Access",
  },
  {
    label: "Reset PIN",
    href: "/admin/users?action=reset-pin",
    icon: "🔑",
    description: "Reset login PIN for any user",
    section: "staff",
    sectionLabel: "Staff & Access",
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: "📊",
    description: "Attendance, payments, student progress",
    section: "reports",
    sectionLabel: "Reports",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: "⚙️",
    description: "Academy name, WhatsApp number, logo",
    section: "settings",
    sectionLabel: "Settings",
  },
];

export function adminTitleForPath(pathname: string | null): string {
  if (!pathname || pathname === "/admin" || pathname === "/admin/dashboard") {
    return "Home";
  }
  const sorted = [...ADMIN_NAV_ITEMS].sort((a, b) => b.href.length - a.href.length);
  const hit = sorted.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return hit?.label ?? "Home";
}

export function adminTitleKeyForPath(): "admin_nav_home" {
  return "admin_nav_home";
}
