import type { Role } from "@/lib/roles";

export const USERS_STORAGE_KEY = "motiva-users";

/** Schema: Users (public mirror) — id, name, email, role */
export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

const LEGACY_TEACHERS_KEY = "motiva-admin-teachers";
const LEGACY_STUDENTS_KEY = "motiva-admin-students";

function normEmail(email: string) {
  return email.trim().toLowerCase();
}

function normMobile(m: string) {
  return m.replace(/\s/g, "").trim();
}

function isUserRecord(x: unknown): x is UserRecord {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.name !== "string" ||
    typeof o.email !== "string"
  ) {
    return false;
  }
  return (
    o.role === "admin" ||
    o.role === "teacher" ||
    o.role === "student" ||
    o.role === "parent" ||
    o.role === "telecounselor" ||
    o.role === "demo_executive" ||
    o.role === "mentor"
  );
}

function readRawUsers(): UserRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isUserRecord);
  } catch {
    return [];
  }
}

function saveUsers(users: UserRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function migrateUsersFromLegacy() {
  if (typeof window === "undefined") return;
  /** Only when key is absent — avoids re-importing legacy if `[]` was saved on purpose. */
  if (window.localStorage.getItem(USERS_STORAGE_KEY) !== null) return;

  const parseArr = (key: string): unknown[] => {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    try {
      const data = JSON.parse(raw) as unknown;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const tRaw = parseArr(LEGACY_TEACHERS_KEY);
  const sRaw = parseArr(LEGACY_STUDENTS_KEY);

  const users: UserRecord[] = [];

  for (const row of tRaw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (
      typeof o.id === "string" &&
      typeof o.name === "string" &&
      typeof o.mobile === "string"
    ) {
      users.push({
        id: o.id,
        name: o.name,
        email: `${normMobile(o.mobile)}@legacy.local`,
        role: "teacher",
      });
    }
  }

  for (const row of sRaw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (
      typeof o.id === "string" &&
      typeof o.name === "string" &&
      typeof o.mobile === "string"
    ) {
      users.push({
        id: o.id,
        name: o.name,
        email: `${normMobile(o.mobile)}@legacy.local`,
        role: "student",
      });
    }
  }

  saveUsers(users);
}

export function listUsers(): UserRecord[] {
  migrateUsersFromLegacy();
  return readRawUsers();
}

export function listUsersByRole(role: Role): UserRecord[] {
  return listUsers().filter((u) => u.role === role);
}

export function getUserById(id: string): UserRecord | null {
  return listUsers().find((u) => u.id === id) ?? null;
}

function notifyUsersUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("motiva-users-updated"));
}

export function setUsersMirror(users: UserRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  notifyUsersUpdated();
}

export function upsertUserPublic(user: UserRecord) {
  const existing = listUsers();
  const next = [
    ...existing.filter((u) => u.id !== user.id),
    { ...user, email: normEmail(user.email) },
  ];
  setUsersMirror(next);
}

function newId(prefix: string) {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function addTeacher(name: string, email: string): UserRecord {
  const record: UserRecord = {
    id: newId("t"),
    name: name.trim(),
    email: normEmail(email),
    role: "teacher",
  };
  saveUsers([...listUsers(), record]);
  notifyUsersUpdated();
  return record;
}

export function addStudent(name: string, email: string): UserRecord {
  const record: UserRecord = {
    id: newId("s"),
    name: name.trim(),
    email: normEmail(email),
    role: "student",
  };
  saveUsers([...listUsers(), record]);
  notifyUsersUpdated();
  return record;
}

export function deleteUser(id: string) {
  saveUsers(listUsers().filter((u) => u.id !== id));
  notifyUsersUpdated();
}
