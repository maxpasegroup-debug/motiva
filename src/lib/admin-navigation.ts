import type { Role } from "@/lib/roles";

export type AdminRole = Extract<
  Role,
  "admin" | "telecounselor" | "demo_executive" | "mentor" | "teacher"
>;

export type AdminNavItem = {
  title: string;
  href: string;
  icon: string;
  roles: AdminRole[];
  badge?: string;
  children?: AdminNavChild[];
};

export type AdminNavChild = {
  title: string;
  href: string;
  roles: AdminRole[];
  badge?: string;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_ROLES: AdminRole[] = [
  "admin",
  "telecounselor",
  "demo_executive",
  "mentor",
  "teacher",
];

const everyone: AdminRole[] = ADMIN_ROLES;
const adminOnly: AdminRole[] = ["admin"];
const admissionsRoles: AdminRole[] = ["admin", "telecounselor", "demo_executive"];
const academicRoles: AdminRole[] = ["admin", "mentor", "teacher"];

export const ADMIN_NAVIGATION: AdminNavGroup[] = [
  {
    title: "Menu",
    items: [
      {
        title: "Today",
        href: "/admin/dashboard",
        icon: "LayoutDashboard",
        roles: everyone,
        children: [
          { title: "Today", href: "/admin/dashboard", roles: everyone },
          { title: "Needs Attention", href: "/admin/dashboard#attention", roles: everyone },
          { title: "Classes Today", href: "/admin/dashboard#classes", roles: everyone },
        ],
      },
      {
        title: "Enquiries",
        href: "/admin/leads",
        icon: "Handshake",
        roles: admissionsRoles,
        children: [
          { title: "Enquiries", href: "/admin/enquiries", roles: ["admin", "telecounselor"] },
          { title: "Leads", href: "/admin/leads", roles: admissionsRoles },
          { title: "Admission Approval", href: "/admin/admissions", roles: ["admin", "telecounselor"] },
          { title: "Create Account", href: "/admin/admissions/create-account", roles: ["admin", "telecounselor"] },
          { title: "Remedial Admission", href: "/admin/admissions/remedial", roles: ["admin", "telecounselor"] },
        ],
      },
      {
        title: "Students",
        href: "/admin/students",
        icon: "UsersRound",
        roles: ["admin", "mentor", "teacher"],
        children: [
          { title: "All Students", href: "/admin/students", roles: ["admin", "mentor", "teacher"] },
          { title: "Parents", href: "/admin/parents", roles: adminOnly },
          { title: "Student Payments", href: "/admin/payments", roles: adminOnly },
        ],
      },
      {
        title: "Classes",
        href: "/admin/batches",
        icon: "GraduationCap",
        roles: academicRoles,
        children: [
          { title: "Batches", href: "/admin/batches", roles: academicRoles },
          { title: "Live Classes", href: "/admin/classes", roles: academicRoles },
          { title: "Teachers", href: "/admin/teachers", roles: ["admin", "teacher"] },
          { title: "Mentor Work", href: "/mentor", roles: ["admin", "mentor"] },
        ],
      },
      {
        title: "Money",
        href: "/admin/payments",
        icon: "IndianRupee",
        roles: adminOnly,
        children: [
          { title: "Payments", href: "/admin/payments", roles: adminOnly },
          { title: "Pending Fees", href: "/admin/payments", roles: adminOnly },
          { title: "Reports", href: "/admin/reports", roles: adminOnly },
        ],
      },
      {
        title: "Settings",
        href: "/admin/users",
        icon: "Settings",
        roles: adminOnly,
        children: [
          { title: "Users & PIN", href: "/admin/users", roles: adminOnly },
          { title: "Recorded Courses", href: "/admin/courses", roles: adminOnly },
          { title: "Add Recorded Course", href: "/admin/courses/new", roles: adminOnly },
          { title: "Website Programs", href: "/admin/programs", roles: adminOnly },
          { title: "Settings", href: "/admin/settings", roles: adminOnly },
          { title: "Reports", href: "/admin/reports", roles: adminOnly },
        ],
      },
    ],
  },
];

export const ADMIN_ROUTE_ALIASES: Record<string, string> = {
  "/admin/classes": "Live Classes",
  "/admin/pin-reset-requests": "PIN Reset Requests",
};

function roleCanSee(roles: AdminRole[], role: Role | null | undefined): boolean {
  return !!role && roles.includes(role as AdminRole);
}

export function getAdminNavigationForRole(role: Role | null | undefined): AdminNavGroup[] {
  return ADMIN_NAVIGATION.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => roleCanSee(item.roles, role))
      .map((item) => ({
        ...item,
        children: item.children?.filter((child) => roleCanSee(child.roles, role)),
      })),
  })).filter((group) => group.items.length > 0);
}

export function isAdminPathActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/admin/dashboard") return pathname === href || pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findAdminNavTitle(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  const matches = ADMIN_NAVIGATION.flatMap((group) =>
    group.items.flatMap((item) => [item, ...(item.children ?? [])]),
  ).sort((a, b) => b.href.length - a.href.length);
  const hit = matches.find((item) => isAdminPathActive(pathname, item.href));
  return hit?.title ?? ADMIN_ROUTE_ALIASES[pathname] ?? "Dashboard";
}

export function getAdminBreadcrumbs(pathname: string | null): { title: string; href: string }[] {
  if (!pathname || pathname === "/admin" || pathname === "/admin/dashboard") {
    return [{ title: "Dashboard", href: "/admin/dashboard" }];
  }

  for (const group of ADMIN_NAVIGATION) {
    for (const item of group.items) {
      if (isAdminPathActive(pathname, item.href)) {
        const child = item.children
          ?.slice()
          .sort((a, b) => b.href.length - a.href.length)
          .find((candidate) => isAdminPathActive(pathname, candidate.href));
        return child && child.href !== item.href
          ? [
              { title: item.title, href: item.href },
              { title: child.title, href: child.href },
            ]
          : [{ title: item.title, href: item.href }];
      }
    }
  }

  return [{ title: findAdminNavTitle(pathname), href: pathname }];
}
