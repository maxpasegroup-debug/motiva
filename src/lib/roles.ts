export type Role =
  | "admin"
  | "telecounselor"
  | "demo_executive"
  | "administrative_officer"
  | "manager"
  | "academic_coordinator"
  | "hr"
  | "mentor"
  | "teacher"
  | "student"
  | "parent"
  | "public";

export const DEFAULT_ROLE: Role = "admin";

export const ROLES: readonly Role[] = [
  "admin",
  "telecounselor",
  "demo_executive",
  "administrative_officer",
  "manager",
  "academic_coordinator",
  "hr",
  "mentor",
  "teacher",
  "student",
  "parent",
  "public",
] as const;

const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  telecounselor: "/admin/admissions",
  demo_executive: "/demo",
  administrative_officer: "/admin",
  manager: "/admin",
  academic_coordinator: "/admin",
  hr: "/admin/users",
  mentor: "/mentor",
  teacher: "/teacher",
  student: "/student",
  parent: "/parent",
  public: "/courses",
};

export function getRoleHome(role: Role): string {
  return ROLE_HOME[role];
}

export function parseRole(value: unknown): Role {
  if (
    value === "admin" ||
    value === "telecounselor" ||
    value === "demo_executive" ||
    value === "administrative_officer" ||
    value === "manager" ||
    value === "academic_coordinator" ||
    value === "hr" ||
    value === "mentor" ||
    value === "teacher" ||
    value === "student" ||
    value === "parent" ||
    value === "public"
  ) {
    return value;
  }
  return DEFAULT_ROLE;
}

export function isRole(value: unknown): value is Role {
  return ROLES.includes(value as Role);
}
