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
    title: "Run Academy",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: "LayoutDashboard",
        roles: everyone,
        children: [
          { title: "Overview", href: "/admin/dashboard", roles: everyone },
          { title: "Today\'s Tasks", href: "/admin/dashboard#tasks", roles: everyone },
          { title: "Alerts", href: "/admin/dashboard#alerts", roles: everyone },
          { title: "Recent Activity", href: "/admin/dashboard#activity", roles: everyone },
        ],
      },
      {
        title: "Academic Management",
        href: "/admin/batches",
        icon: "GraduationCap",
        roles: academicRoles,
        children: [
          { title: "Batches", href: "/admin/batches", roles: academicRoles },
          { title: "Live Classes", href: "/admin/classes", roles: academicRoles },
          { title: "Programs", href: "/admin/programs", roles: adminOnly },
          { title: "Batch Progress", href: "/admin/batches", roles: academicRoles },
        ],
      },
      {
        title: "Students",
        href: "/admin/students",
        icon: "UsersRound",
        roles: ["admin", "mentor", "teacher"],
        children: [
          { title: "All Students", href: "/admin/students", roles: ["admin", "mentor", "teacher"] },
          { title: "New Admissions", href: "/admin/admissions", roles: ["admin"] },
          { title: "Student Payments", href: "/admin/payments", roles: adminOnly },
        ],
      },
      {
        title: "Parents",
        href: "/admin/parents",
        icon: "HeartHandshake",
        roles: adminOnly,
        children: [
          { title: "All Parents", href: "/admin/parents", roles: adminOnly },
          { title: "Parent Accounts", href: "/admin/parents", roles: adminOnly },
          { title: "Notifications", href: "/admin/parents", roles: adminOnly },
        ],
      },
    ],
  },
  {
    title: "Grow Academy",
    items: [
      {
        title: "CRM & Admissions",
        href: "/admin/leads",
        icon: "Handshake",
        roles: admissionsRoles,
        children: [
          { title: "Enquiries", href: "/admin/enquiries", roles: ["admin", "telecounselor"] },
          { title: "Leads", href: "/admin/leads", roles: admissionsRoles },
          { title: "Demo Classes", href: "/admin/leads", roles: admissionsRoles },
          { title: "Admissions Pipeline", href: "/admin/admissions", roles: ["admin", "telecounselor"] },
          { title: "Remedial Admissions", href: "/admin/admissions/remedial", roles: ["admin", "telecounselor"] },
          { title: "Create Student Account", href: "/admin/admissions/create-account", roles: ["admin", "telecounselor"] },
        ],
      },
      {
        title: "Marketing",
        href: "/admin/enquiries",
        icon: "Megaphone",
        roles: ["admin", "telecounselor"],
        children: [
          { title: "Landing Page Leads", href: "/admin/enquiries", roles: ["admin", "telecounselor"] },
          { title: "Lead Sources", href: "/admin/leads", roles: ["admin", "telecounselor"] },
          { title: "WhatsApp Campaigns", href: "/admin/enquiries", roles: ["admin"] },
        ],
      },
      {
        title: "Communication Center",
        href: "/admin/reports",
        icon: "MessagesSquare",
        roles: everyone,
        children: [
          { title: "Parent Messages", href: "/admin/parents", roles: adminOnly },
          { title: "Student Messages", href: "/admin/students", roles: ["admin", "mentor", "teacher"] },
          { title: "Message Templates", href: "/admin/settings", roles: adminOnly },
        ],
      },
    ],
  },
  {
    title: "Team",
    items: [
      {
        title: "Teachers",
        href: "/admin/teachers",
        icon: "Presentation",
        roles: ["admin", "teacher"],
        children: [
          { title: "All Teachers", href: "/admin/teachers", roles: adminOnly },
          { title: "Add Teacher", href: "/admin/teachers/new", roles: adminOnly },
          { title: "Teacher Assignments", href: "/admin/batches", roles: ["admin", "teacher"] },
        ],
      },
      {
        title: "Mentors",
        href: "/mentor",
        icon: "UserRoundCheck",
        roles: ["admin", "mentor"],
        children: [
          { title: "Mentor Dashboard", href: "/mentor", roles: ["mentor"] },
          { title: "Student Learning Plans", href: "/mentor/students", roles: ["mentor"] },
          { title: "Mentor Issues", href: "/mentor/issues", roles: ["mentor"] },
          { title: "Assign Mentor", href: "/admin/admissions", roles: adminOnly },
        ],
      },
      {
        title: "Users & Access",
        href: "/admin/users",
        icon: "ShieldCheck",
        roles: adminOnly,
        children: [
          { title: "Admin Users", href: "/admin/users", roles: adminOnly },
          { title: "Staff Users", href: "/admin/users", roles: adminOnly },
          { title: "PIN Reset Requests", href: "/admin/users", roles: adminOnly },
        ],
      },
    ],
  },
  {
    title: "Money & Content",
    items: [
      {
        title: "Finance & Payments",
        href: "/admin/payments",
        icon: "IndianRupee",
        roles: adminOnly,
        children: [
          { title: "Payments Overview", href: "/admin/payments", roles: adminOnly },
          { title: "Pending Fees", href: "/admin/payments", roles: adminOnly },
          { title: "Revenue Reports", href: "/admin/reports", roles: adminOnly },
        ],
      },
      {
        title: "Recorded Courses",
        href: "/admin/courses",
        icon: "BookOpenCheck",
        roles: adminOnly,
        children: [
          { title: "All Courses", href: "/admin/courses", roles: adminOnly },
          { title: "Add Course", href: "/admin/courses/new", roles: adminOnly },
          { title: "Course Sales", href: "/admin/payments", roles: adminOnly },
        ],
      },
      {
        title: "Content & Media",
        href: "/admin/programs",
        icon: "Image",
        roles: adminOnly,
        children: [
          { title: "Website Programs", href: "/admin/programs", roles: adminOnly },
          { title: "Teacher Profiles", href: "/admin/teachers", roles: adminOnly },
          { title: "Course Media", href: "/admin/courses", roles: adminOnly },
        ],
      },
    ],
  },
  {
    title: "Control",
    items: [
      {
        title: "Reports & Analytics",
        href: "/admin/reports",
        icon: "ChartNoAxesCombined",
        roles: adminOnly,
        children: [
          { title: "Academy Overview", href: "/admin/reports", roles: adminOnly },
          { title: "Admissions Report", href: "/admin/reports", roles: adminOnly },
          { title: "Revenue Report", href: "/admin/reports", roles: adminOnly },
          { title: "Attendance Report", href: "/admin/reports", roles: adminOnly },
        ],
      },
      {
        title: "Automation",
        href: "/admin/settings",
        icon: "Workflow",
        roles: adminOnly,
        children: [
          { title: "Lead Follow-ups", href: "/admin/settings", roles: adminOnly },
          { title: "Fee Reminders", href: "/admin/settings", roles: adminOnly },
          { title: "Class Reminders", href: "/admin/settings", roles: adminOnly },
        ],
      },
      {
        title: "Settings",
        href: "/admin/settings",
        icon: "Settings",
        roles: adminOnly,
        children: [
          { title: "Academy Profile", href: "/admin/settings", roles: adminOnly },
          { title: "Payment Settings", href: "/admin/settings", roles: adminOnly },
          { title: "WhatsApp Settings", href: "/admin/settings", roles: adminOnly },
          { title: "Security Settings", href: "/admin/settings", roles: adminOnly },
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
