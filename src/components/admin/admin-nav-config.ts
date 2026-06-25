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
    label: "Today",
    href: "/admin",
    icon: "T",
    description: "Work that needs attention today",
    section: "main",
    sectionLabel: "Daily Work",
  },
  {
    label: "Enquiries",
    href: "/admin/enquiries",
    icon: "E",
    description: "Calls, WhatsApp follow-up, admissions",
    section: "students",
    sectionLabel: "Daily Work",
    badgeKey: "enquiries",
  },
  {
    label: "Admissions",
    href: "/admin/admissions",
    icon: "A",
    description: "Approve students and create login",
    section: "students",
    sectionLabel: "Daily Work",
  },
  {
    label: "Students",
    href: "/admin/students",
    icon: "S",
    description: "Search and manage student details",
    section: "students",
    sectionLabel: "Daily Work",
  },
  {
    label: "Fees",
    href: "/admin/payments",
    icon: "F",
    description: "Fee collection and pending payments",
    section: "students",
    sectionLabel: "Daily Work",
  },
  {
    label: "Classes",
    href: "/admin/batches",
    icon: "C",
    description: "Offline, online, and batch classes",
    section: "classes",
    sectionLabel: "Learning",
  },
  {
    label: "Attendance",
    href: "/admin/attendance",
    icon: "P",
    description: "Mark and check daily presence",
    section: "classes",
    sectionLabel: "Learning",
  },
  {
    label: "Teachers",
    href: "/admin/teachers",
    icon: "T",
    description: "Teacher list and profiles",
    section: "classes",
    sectionLabel: "Learning",
  },
  {
    label: "Recorded Lessons",
    href: "/admin/courses",
    icon: "R",
    description: "Video lessons and student access",
    section: "courses",
    sectionLabel: "Learning",
  },
  {
    label: "Staff",
    href: "/admin/users",
    icon: "U",
    description: "Staff login and access",
    section: "staff",
    sectionLabel: "Office",
  },
  {
    label: "Reset PIN",
    href: "/admin/users?action=reset-pin",
    icon: "K",
    description: "Help users enter again",
    section: "staff",
    sectionLabel: "Office",
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: "R",
    description: "Attendance, fees, student progress",
    section: "reports",
    sectionLabel: "Office",
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: "G",
    description: "Academy name, WhatsApp number, logo",
    section: "settings",
    sectionLabel: "Office",
  },
];

export function adminTitleForPath(pathname: string | null): string {
  if (!pathname || pathname === "/admin" || pathname === "/admin/dashboard") {
    return "Today";
  }
  const sorted = [...ADMIN_NAV_ITEMS].sort((a, b) => b.href.length - a.href.length);
  const hit = sorted.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return hit?.label ?? "Today";
}

export function adminTitleKeyForPath(): "admin_nav_home" {
  return "admin_nav_home";
}
