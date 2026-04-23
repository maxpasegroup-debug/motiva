import { getPool } from "@/server/db/pool";

let tableReady: Promise<void> | null = null;

export function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

async function ensureTables(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parents (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      phone_normalized VARCHAR(32) NOT NULL,
      student_id VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_parents_phone_norm ON parents (phone_normalized)`,
  );
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_parents_email_lower ON parents (LOWER(email))
    WHERE email IS NOT NULL
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parent_notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_id VARCHAR(255) NOT NULL REFERENCES parents (id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      is_read BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent ON parent_notifications (parent_id, created_at DESC)`,
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS student_payment_status (
      student_id VARCHAR(255) PRIMARY KEY,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export function ensureParentsPortalTables(): Promise<void> {
  if (!tableReady) {
    tableReady = ensureTables();
  }
  return tableReady;
}

export type ParentRow = {
  id: string;
  name: string;
  phone: string;
  phone_normalized: string;
  student_id: string;
  email: string | null;
  created_at: Date;
};

export async function upsertParentRecord(input: {
  id: string;
  name: string;
  phone: string;
  student_id: string;
  email?: string | null;
}): Promise<void> {
  await ensureParentsPortalTables();
  const pool = getPool();
  const phoneNorm = normalizePhoneDigits(input.phone) || "0";
  const email =
    input.email && input.email.trim() ? input.email.trim().toLowerCase() : null;
  await pool.query(
    `
    INSERT INTO parents (id, name, phone, phone_normalized, student_id, email)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      phone_normalized = EXCLUDED.phone_normalized,
      student_id = EXCLUDED.student_id,
      email = COALESCE(EXCLUDED.email, parents.email)
    `,
    [
      input.id,
      input.name.trim(),
      input.phone.trim(),
      phoneNorm,
      input.student_id,
      email,
    ],
  );
}

export async function getParentById(
  parentUserId: string,
): Promise<ParentRow | null> {
  await ensureParentsPortalTables();
  const pool = getPool();
  const res = await pool.query<ParentRow>(
    `SELECT id, name, phone, phone_normalized, student_id, email, created_at
     FROM parents WHERE id = $1`,
    [parentUserId],
  );
  return res.rows[0] ?? null;
}

/** First match by normalized digits (login). */
export async function findParentIdByPhoneDigits(
  digits: string,
): Promise<string | null> {
  if (!digits) return null;
  await ensureParentsPortalTables();
  const pool = getPool();
  const res = await pool.query<{ id: string }>(
    `SELECT id FROM parents WHERE phone_normalized = $1 LIMIT 1`,
    [digits],
  );
  return res.rows[0]?.id ?? null;
}

export async function findParentIdByContactEmail(
  email: string,
): Promise<string | null> {
  const e = email.trim().toLowerCase();
  if (!e) return null;
  await ensureParentsPortalTables();
  const pool = getPool();
  const res = await pool.query<{ id: string }>(
    `SELECT id FROM parents WHERE LOWER(email) = $1 LIMIT 1`,
    [e],
  );
  return res.rows[0]?.id ?? null;
}

export async function listParentIdsForStudentIds(
  studentIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (studentIds.length === 0) return out;
  await ensureParentsPortalTables();
  const pool = getPool();
  const res = await pool.query<{ student_id: string; id: string }>(
    `SELECT student_id, id FROM parents WHERE student_id = ANY($1::varchar[])`,
    [studentIds],
  );
  for (const r of res.rows) out.set(r.student_id, r.id);
  return out;
}

export type ParentNotificationRow = {
  id: string;
  parent_id: string;
  message: string;
  created_at: Date;
  is_read: boolean;
};

export async function createParentNotification(
  parentId: string,
  message: string,
): Promise<void> {
  await ensureParentsPortalTables();
  const pool = getPool();
  await pool.query(
    `INSERT INTO parent_notifications (parent_id, message) VALUES ($1, $2)`,
    [parentId, message],
  );
}

export async function listParentNotifications(
  parentId: string,
  limit: number,
): Promise<ParentNotificationRow[]> {
  await ensureParentsPortalTables();
  const pool = getPool();
  const lim = Math.min(100, Math.max(1, limit));
  const res = await pool.query<ParentNotificationRow>(
    `
    SELECT id, parent_id, message, created_at, is_read
    FROM parent_notifications
    WHERE parent_id = $1
    ORDER BY created_at DESC
    LIMIT $2
    `,
    [parentId, lim],
  );
  return res.rows;
}

export async function countUnreadParentNotifications(
  parentId: string,
): Promise<number> {
  await ensureParentsPortalTables();
  const pool = getPool();
  const res = await pool.query<{ c: string }>(
    `
    SELECT COUNT(*)::text AS c FROM parent_notifications
    WHERE parent_id = $1 AND is_read = FALSE
    `,
    [parentId],
  );
  return Number(res.rows[0]?.c) || 0;
}

export async function markParentNotificationsRead(
  parentId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  await ensureParentsPortalTables();
  const pool = getPool();
  await pool.query(
    `
    UPDATE parent_notifications SET is_read = TRUE
    WHERE parent_id = $1 AND id = ANY($2::uuid[])
    `,
    [parentId, ids],
  );
}

export async function markAllParentNotificationsRead(
  parentId: string,
): Promise<void> {
  await ensureParentsPortalTables();
  const pool = getPool();
  await pool.query(
    `
    UPDATE parent_notifications SET is_read = TRUE
    WHERE parent_id = $1
    `,
    [parentId],
  );
}

export async function getStudentPaymentStatusDb(
  studentId: string,
): Promise<"paid" | "pending"> {
  await ensureParentsPortalTables();
  const pool = getPool();
  const res = await pool.query<{ status: "paid" | "pending" }>(
    `SELECT status FROM student_payment_status WHERE student_id = $1`,
    [studentId],
  );
  return res.rows[0]?.status ?? "pending";
}

export async function upsertStudentPaymentStatusDb(
  studentId: string,
  status: "paid" | "pending",
): Promise<void> {
  await ensureParentsPortalTables();
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO student_payment_status (student_id, status, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (student_id) DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = NOW()
    `,
    [studentId, status],
  );
}
