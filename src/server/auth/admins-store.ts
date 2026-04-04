import bcrypt from "bcrypt";
import type { Role } from "@/lib/roles";
import { getDatabaseUrl, getPool } from "@/server/db/pool";

export type AdminRow = {
  id: string;
  email: string;
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

export async function findAdminByEmail(
  email: string,
): Promise<AdminRow | null> {
  await ensureAdminsSchema();
  const pool = getPool();
  const res = await pool.query<AdminRow>(
    `SELECT id, email, password_hash, role FROM admins WHERE email = $1`,
    [normalizeEmail(email)],
  );
  return res.rows[0] ?? null;
}

export async function findAdminById(id: string): Promise<AdminRow | null> {
  await ensureAdminsSchema();
  const pool = getPool();
  const res = await pool.query<AdminRow>(
    `SELECT id, email, password_hash, role FROM admins WHERE id = $1`,
    [id],
  );
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
      await pool.query(
        `INSERT INTO admins (email, password_hash, role) VALUES ($1, $2, 'admin')`,
        [normalizeEmail(bootEmail), passwordHash],
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
    role: row.role as Role,
  };
}

export function adminJwtClaims(row: AdminRow) {
  return {
    id: row.id,
    email: row.email,
    role: row.role as Role,
    name: adminDisplayName(row.email),
  };
}
