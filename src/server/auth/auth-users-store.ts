import fs from "fs/promises";
import path from "path";
import type { Role } from "@/lib/roles";
import bcrypt from "bcrypt";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  role: Role;
};

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "auth-users.json");

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

function newId(prefix: string) {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify([]), "utf-8");
  }
}

function isValidRole(r: unknown): r is Role {
  return (
    r === "admin" ||
    r === "telecounselor" ||
    r === "demo_executive" ||
    r === "mentor" ||
    r === "teacher" ||
    r === "student" ||
    r === "parent"
  );
}

export async function readAuthUsers(): Promise<AuthUser[]> {
  await ensureDataFile();
  const raw = await fs.readFile(USERS_FILE, "utf-8");
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) return [];

  return data.filter((u): u is AuthUser => {
    if (!u || typeof u !== "object") return false;
    const o = u as Record<string, unknown>;
    const phoneOk =
      o.phone === undefined ||
      o.phone === null ||
      typeof o.phone === "string";
    return (
      typeof o.id === "string" &&
      typeof o.name === "string" &&
      typeof o.email === "string" &&
      typeof o.passwordHash === "string" &&
      isValidRole(o.role) &&
      phoneOk
    );
  });
}

export async function writeAuthUsers(users: AuthUser[]) {
  await ensureDataFile();
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
}

export async function findAuthUserByEmail(email: string) {
  const e = normalizeEmail(email);
  const users = await readAuthUsers();
  return users.find((u) => normalizeEmail(u.email) === e) ?? null;
}

export async function findAuthUserByPhoneDigits(digits: string) {
  if (!digits) return null;
  const users = await readAuthUsers();
  return (
    users.find((u) => {
      const p = u.phone ? normalizePhoneDigits(u.phone) : "";
      return p && p === digits;
    }) ?? null
  );
}

export async function findAuthUserById(id: string) {
  const users = await readAuthUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function ensureSeedAdmin() {
  const users = await readAuthUsers();
  if (users.length > 0) return;

  const bootEmail = process.env.ADMIN_BOOT_EMAIL ?? "admin@motiva.local";
  const bootPassword = process.env.ADMIN_BOOT_PASSWORD ?? "admin1234";
  const passwordHash = await bcrypt.hash(bootPassword, 10);

  users.push({
    id: newId("u"),
    name: "Admin",
    email: normalizeEmail(bootEmail),
    passwordHash,
    role: "admin",
  });

  await writeAuthUsers(users);
}

export function isCreatableRole(role: Role) {
  return (
    role === "teacher" ||
    role === "student" ||
    role === "admin" ||
    role === "parent" ||
    role === "telecounselor" ||
    role === "demo_executive" ||
    role === "mentor"
  );
}

export async function createUserAsAdmin(input: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string | null;
}) {
  const users = await readAuthUsers();
  const email = normalizeEmail(input.email);
  const exists = users.some((u) => normalizeEmail(u.email) === email);
  if (exists) {
    return { ok: false as const, error: "Email already exists" };
  }
  const record: AuthUser = {
    id: newId("u"),
    name: input.name.trim(),
    email,
    phone: input.phone?.trim() || null,
    passwordHash: input.passwordHash,
    role: input.role,
  };
  users.push(record);
  await writeAuthUsers(users);
  return { ok: true as const, user: record };
}

export async function deleteUserAsAdmin(id: string) {
  const users = await readAuthUsers();
  const next = users.filter((u) => u.id !== id);
  await writeAuthUsers(next);
}

export function toPublicUser(u: AuthUser) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
  };
}
