export type Role = "admin" | "teacher" | "student";

export const DEFAULT_ROLE: Role = "admin";

export const ROLES: readonly Role[] = ["admin", "teacher", "student"] as const;

const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/dashboard",
};

export function getRoleHome(role: Role): string {
  return ROLE_HOME[role];
}

export function parseRole(value: unknown): Role {
  if (value === "admin" || value === "teacher" || value === "student") {
    return value;
  }
  return DEFAULT_ROLE;
}
