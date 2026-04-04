import { getPool } from "@/server/db/pool";

let tableReady: Promise<void> | null = null;

async function ensureAdmissionRequestsTable(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admission_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_name VARCHAR(255) NOT NULL,
      parent_name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      program_id VARCHAR(64) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT admission_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_admission_requests_status ON admission_requests (status)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_admission_requests_created_at ON admission_requests (created_at DESC)`,
  );
}

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = ensureAdmissionRequestsTable();
  }
  return tableReady;
}

export type AdmissionRow = {
  id: string;
  student_name: string;
  parent_name: string;
  phone: string;
  program_id: string;
  status: string;
  created_at: Date;
};

export async function listAdmissionRequests(): Promise<AdmissionRow[]> {
  await ensureTable();
  const pool = getPool();
  const res = await pool.query<AdmissionRow>(
    `
    SELECT id, student_name, parent_name, phone, program_id, status, created_at
    FROM admission_requests
    ORDER BY created_at DESC
    `,
  );
  return res.rows;
}

export async function getAdmissionRequestById(
  id: string,
): Promise<AdmissionRow | null> {
  await ensureTable();
  const pool = getPool();
  const res = await pool.query<AdmissionRow>(
    `
    SELECT id, student_name, parent_name, phone, program_id, status, created_at
    FROM admission_requests
    WHERE id = $1
    `,
    [id],
  );
  return res.rows[0] ?? null;
}

export async function updateAdmissionRequestStatus(
  id: string,
  status: "pending" | "approved" | "rejected",
): Promise<boolean> {
  await ensureTable();
  const pool = getPool();
  const res = await pool.query(
    `UPDATE admission_requests SET status = $2 WHERE id = $1`,
    [id, status],
  );
  return (res.rowCount ?? 0) > 0;
}

export async function insertAdmissionRequest(input: {
  student_name: string;
  parent_name: string;
  phone: string;
  program_id: string;
}): Promise<{ id: string }> {
  await ensureTable();
  const pool = getPool();
  const res = await pool.query<{ id: string }>(
    `
    INSERT INTO admission_requests (student_name, parent_name, phone, program_id, status)
    VALUES ($1, $2, $3, $4, 'pending')
    RETURNING id
    `,
    [
      input.student_name.trim(),
      input.parent_name.trim(),
      input.phone.trim(),
      input.program_id.trim(),
    ],
  );
  const row = res.rows[0];
  if (!row?.id) {
    throw new Error("Insert failed");
  }
  return { id: row.id };
}
