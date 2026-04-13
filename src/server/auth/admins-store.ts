import bcrypt from "bcrypt";
import { parseRole } from "@/lib/roles";
import { normalizePhoneDigits } from "@/server/parents/parents-portal-db";
import { getDatabaseUrl, getPool } from "@/server/db/pool";

export type AdminRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  phone_normalized: string | null;
  password_hash: string;
  role: string;
};

let tableEnsured: Promise<void> | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}

async function ensureAdminsTable(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'admin'
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_admins_email ON admins (email)`,
  );
  await pool.query(
    `ALTER TABLE admins ADD COLUMN IF NOT EXISTS name VARCHAR(255)`,
  );
  await pool.query(
    `ALTER TABLE admins ADD COLUMN IF NOT EXISTS phone VARCHAR(64)`,
  );
  await pool.query(
    `ALTER TABLE admins ADD COLUMN IF NOT EXISTS phone_normalized VARCHAR(32)`,
  );
  await pool.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_phone_normalized ON admins (phone_normalized) WHERE phone_normalized IS NOT NULL AND phone_normalized <> ''`,
  );
}

export function ensureAdminsSchema(): Promise<void> {
  if (!tableEnsured) {
    tableEnsured = ensureAdminsTable();
  }
  return tableEnsured;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const ADMIN_SELECT = `
  SELECT id, email, name, phone, phone_normalized, password_hash, role
  FROM admins
`;

export async function findAdminByEmail(
  email: string,
): Promise<AdminRow | null> {
  await ensureAdminsSchema();
  const pool = getPool();
  const res = await pool.query<AdminRow>(
    `${ADMIN_SELECT} WHERE email = $1`,
    [normalizeEmail(email)],
  );
  return res.rows[0] ?? null;
}

export async function findAdminByLogin(login: string): Promise<AdminRow | null> {
  const raw = login.trim();
  if (!raw) return null;
  if (raw.includes("@")) {
    return findAdminByEmail(raw);
  }
  const digits = normalizePhoneDigits(raw);
  if (digits.length < 8) return null;
  await ensureAdminsSchema();
  const pool = getPool();
  const res = await pool.query<AdminRow>(
    `${ADMIN_SELECT} WHERE phone_normalized = $1`,
    [digits],
  );
  return res.rows[0] ?? null;
}

export async function findAdminById(id: string): Promise<AdminRow | null> {
  await ensureAdminsSchema();
  const pool = getPool();
  const res = await pool.query<AdminRow>(`${ADMIN_SELECT} WHERE id = $1`, [
    id,
  ]);
  return res.rows[0] ?? null;
}

export async function countAdmins(): Promise<number> {
  await ensureAdminsSchema();
  const pool = getPool();
  const res = await pool.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM admins`,
  );
  return Number(res.rows[0]?.count ?? 0);
}

let dbSeedOnce: Promise<void> | null = null;

/** Bootstrap first admin when the admins table is empty (once per process). */
export async function ensureSeedAdminDb(): Promise<void> {
  if (!dbSeedOnce) {
    dbSeedOnce = (async () => {
      await ensureAdminsSchema();
      const n = await countAdmins();
      if (n > 0) return;

      const bootEmail =
        process.env.ADMIN_BOOT_EMAIL ?? "admin@motiva.local";
      const bootPassword = process.env.ADMIN_BOOT_PASSWORD ?? "admin1234";
      const passwordHash = await bcrypt.hash(bootPassword, 10);
      const pool = getPool();
      const nm = adminDisplayName(normalizeEmail(bootEmail));
      await pool.query(
        `INSERT INTO admins (email, password_hash, role, name) VALUES ($1, $2, 'admin', $3)`,
        [normalizeEmail(bootEmail), passwordHash, nm],
      );
    })();
  }
  return dbSeedOnce;
}

export function adminDisplayName(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local ? local : "Admin";
}

export function toPublicAdmin(row: AdminRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name?.trim() || adminDisplayName(row.email),
    phone: row.phone,
    role: parseRole(row.role),
  };
}

export function adminJwtClaims(row: AdminRow) {
  return {
    id: row.id,
    email: row.email,
    role: parseRole(row.role),
    name: row.name?.trim() || adminDisplayName(row.email),
  };
}
