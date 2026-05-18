import { ADMIN_NAV_ITEMS } from "@/components/admin/admin-nav-config";
import type { Role } from "@/lib/roles";

export type AdminRole = Extract<
  Role,
  | "admin"
  | "telecounselor"
  | "demo_executive"
  | "administrative_officer"
  | "manager"
  | "academic_coordinator"
  | "hr"
  | "mentor"
  | "teacher"
>;

export type AdminNavItem = {
  title: string;
  href: string;
  icon: string;
  description: string;
  sectionLabel: string;
  roles: AdminRole[];
  children?: AdminNavChild[];
};

export type AdminNavChild = {
  title: string;
  href: string;
  roles: AdminRole[];
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export const ADMIN_ROLES: AdminRole[] = [
  "admin",
  "telecounselor",
  "demo_executive",
  "administrative_officer",
  "manager",
  "academic_coordinator",
  "hr",
  "mentor",
  "teacher",
];

const everyone: AdminRole[] = ADMIN_ROLES;
const adminOnly: AdminRole[] = ["admin"];
const admissionsRoles: AdminRole[] = [
  "admin",
  "telecounselor",
  "administrative_officer",
  "manager",
];
const academicRoles: AdminRole[] = [
  "admin",
  "manager",
  "academic_coordinator",
  "mentor",
  "teacher",
];
const moneyRoles: AdminRole[] = [
  "admin",
  "manager",
  "administrative_officer",
  "telecounselor",
];
const staffRoles: AdminRole[] = ["admin", "manager", "hr"];

const rolesByHref: Record<string, AdminRole[]> = {
  "/admin": everyone,
  "/admin/enquiries": admissionsRoles,
  "/admin/admissions": admissionsRoles,
  "/admin/students": ["admin", "manager", "administrative_officer", "academic_coordinator", "mentor", "teacher"],
  "/admin/payments": moneyRoles,
  "/admin/batches": academicRoles,
  "/admin/attendance": academicRoles,
  "/admin/teachers": ["admin", "manager", "academic_coordinator", "hr", "teacher"],
  "/admin/courses": ["admin", "manager", "academic_coordinator"],
  "/admin/users": staffRoles,
  "/admin/reports": ["admin", "manager", "administrative_officer", "academic_coordinator"],
  "/admin/settings": ["admin", "manager", "administrative_officer"],
};

const hiddenChildren: Record<string, AdminNavChild[]> = {
  "/admin/admissions": [
    { title: "Remedial Admission", href: "/admin/admissions/remedial", roles: admissionsRoles },
    { title: "Create Student Login", href: "/admin/admissions/create-account", roles: admissionsRoles },
  ],
  "/admin/batches": [
    { title: "Live Classes", href: "/admin/classes", roles: academicRoles },
  ],
  "/admin/courses": [
    { title: "New Recorded Course", href: "/admin/courses/new", roles: adminOnly },
    { title: "Website Programs", href: "/admin/programs", roles: ["admin", "manager"] },
  ],
};

export const ADMIN_NAVIGATION: AdminNavGroup[] = ADMIN_NAV_ITEMS.reduce<AdminNavGroup[]>(
  (groups, item) => {
    const group = groups.find((candidate) => candidate.title === item.sectionLabel);
    const navItem: AdminNavItem = {
      title: item.label,
      href: item.href,
      icon: item.icon,
      description: item.description,
      sectionLabel: item.sectionLabel,
      roles: rolesByHref[item.href.split("?")[0]] ?? adminOnly,
      children: hiddenChildren[item.href] ?? [],
    };
    if (group) {
      group.items.push(navItem);
    } else {
      groups.push({ title: item.sectionLabel, items: [navItem] });
    }
    return groups;
  },
  [],
);

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
  const cleanHref = href.split("?")[0];
  if (cleanHref === "/admin") {
    return pathname === "/admin" || pathname === "/admin/dashboard";
  }
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

export function findAdminNavTitle(pathname: string | null): string {
  if (!pathname || pathname === "/admin/dashboard") return "Home";
  const matches = ADMIN_NAVIGATION.flatMap((group) =>
    group.items.flatMap((item) => [item, ...(item.children ?? [])]),
  ).sort((a, b) => b.href.length - a.href.length);
  const hit = matches.find((item) => isAdminPathActive(pathname, item.href));
  return hit?.title ?? "Home";
}

export function getAdminBreadcrumbs(pathname: string | null): { title: string; href: string }[] {
  if (!pathname || pathname === "/admin" || pathname === "/admin/dashboard") {
    return [{ title: "Home", href: "/admin" }];
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
