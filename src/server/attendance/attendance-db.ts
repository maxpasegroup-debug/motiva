import { getPool } from "@/server/db/pool";
import { ensureBatchesDbTables } from "@/server/batches/batches-db";

let tableReady: Promise<void> | null = null;

async function ensureAttendanceTables(): Promise<void> {
  await ensureBatchesDbTables();
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS batch_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_id UUID NOT NULL UNIQUE REFERENCES batches (id) ON DELETE CASCADE,
      current_day INTEGER NOT NULL DEFAULT 1 CHECK (current_day >= 1)
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_batch_progress_batch_id ON batch_progress (batch_id)`,
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id VARCHAR(255) NOT NULL,
      batch_id UUID NOT NULL REFERENCES batches (id) ON DELETE CASCADE,
      day_number INTEGER NOT NULL CHECK (day_number >= 1),
      status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent')),
      marked_by VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT attendance_student_batch_day_unique UNIQUE (student_id, batch_id, day_number)
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_attendance_batch_day ON attendance (batch_id, day_number)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_attendance_batch ON attendance (batch_id)`,
  );
  await pool.query(`
    INSERT INTO batch_progress (batch_id, current_day)
    SELECT b.id, GREATEST(1, LEAST(COALESCE(b.unlocked_day, 1), b.duration))
    FROM batches b
    WHERE NOT EXISTS (SELECT 1 FROM batch_progress bp WHERE bp.batch_id = b.id)
    ON CONFLICT (batch_id) DO NOTHING
  `);
}

function ensureTables(): Promise<void> {
  if (!tableReady) {
    tableReady = ensureAttendanceTables();
  }
  return tableReady;
}

export type BatchProgressRow = {
  id: string;
  batch_id: string;
  current_day: number;
};

export type AttendanceRow = {
  id: string;
  student_id: string;
  batch_id: string;
  day_number: number;
  status: "present" | "absent";
  marked_by: string;
  created_at: Date;
};

export async function createBatchProgress(batchId: string): Promise<void> {
  await ensureTables();
  const pool = getPool();
  await pool.query(
    `
    INSERT INTO batch_progress (batch_id, current_day)
    VALUES ($1, 1)
    ON CONFLICT (batch_id) DO NOTHING
    `,
    [batchId],
  );
}

export async function getBatchProgress(
  batchId: string,
): Promise<BatchProgressRow | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<BatchProgressRow>(
    `SELECT id, batch_id, current_day FROM batch_progress WHERE batch_id = $1`,
    [batchId],
  );
  return res.rows[0] ?? null;
}

export async function getOrCreateBatchProgress(
  batchId: string,
): Promise<BatchProgressRow> {
  let row = await getBatchProgress(batchId);
  if (row) return row;
  await createBatchProgress(batchId);
  row = await getBatchProgress(batchId);
  if (!row) throw new Error("batch_progress missing");
  return row;
}

/** Lesson sort_order (0-based) unlocked when (sort_order + 1) <= current_day */
export function maxUnlockedLessonOrder(currentDay: number): number {
  return Math.max(-1, currentDay - 1);
}

export async function incrementBatchCurrentDay(
  batchId: string,
  duration: number,
): Promise<BatchProgressRow | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<BatchProgressRow>(
    `
    UPDATE batch_progress
    SET current_day = LEAST(current_day + 1, $2)
    WHERE batch_id = $1
    RETURNING id, batch_id, current_day
    `,
    [batchId, duration],
  );
  return res.rows[0] ?? null;
}

export async function replaceAttendanceForDay(input: {
  batchId: string;
  dayNumber: number;
  markedBy: string;
  entries: { student_id: string; status: "present" | "absent" }[];
}): Promise<void> {
  await ensureTables();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM attendance WHERE batch_id = $1 AND day_number = $2`,
      [input.batchId, input.dayNumber],
    );
    for (const e of input.entries) {
      await client.query(
        `
        INSERT INTO attendance (student_id, batch_id, day_number, status, marked_by)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [e.student_id, input.batchId, input.dayNumber, e.status, input.markedBy],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getAttendanceForDay(
  batchId: string,
  dayNumber: number,
): Promise<Map<string, "present" | "absent">> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{
    student_id: string;
    status: "present" | "absent";
  }>(
    `SELECT student_id, status FROM attendance WHERE batch_id = $1 AND day_number = $2`,
    [batchId, dayNumber],
  );
  const m = new Map<string, "present" | "absent">();
  for (const r of res.rows) m.set(r.student_id, r.status);
  return m;
}

export async function countPresentOnDay(
  batchId: string,
  dayNumber: number,
): Promise<number> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{ c: string }>(
    `
    SELECT COUNT(*)::text AS c FROM attendance
    WHERE batch_id = $1 AND day_number = $2 AND status = 'present'
    `,
    [batchId, dayNumber],
  );
  return Number(res.rows[0]?.c) || 0;
}

export async function getStudentDayStatuses(
  studentId: string,
  batchId: string,
  maxDay: number,
): Promise<{ day_number: number; status: "present" | "absent" }[]> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{
    day_number: number;
    status: "present" | "absent";
  }>(
    `
    SELECT day_number, status FROM attendance
    WHERE student_id = $1 AND batch_id = $2 AND day_number <= $3
    ORDER BY day_number ASC
    `,
    [studentId, batchId, maxDay],
  );
  return res.rows;
}

export type StudentAttendanceSummary = {
  student_id: string;
  present: number;
  absent: number;
};

export async function getAttendanceSummaryByStudent(
  batchId: string,
  duration: number,
): Promise<StudentAttendanceSummary[]> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{
    student_id: string;
    present: string;
    absent: string;
  }>(
    `
    SELECT
      student_id,
      COUNT(*) FILTER (WHERE status = 'present')::text AS present,
      COUNT(*) FILTER (WHERE status = 'absent')::text AS absent
    FROM attendance
    WHERE batch_id = $1 AND day_number <= $2
    GROUP BY student_id
    `,
    [batchId, duration],
  );
  return res.rows.map((r) => ({
    student_id: r.student_id,
    present: Number(r.present) || 0,
    absent: Number(r.absent) || 0,
  }));
}

export async function listAttendanceByDay(
  batchId: string,
  duration: number,
): Promise<
  { day_number: number; records: { student_id: string; status: string }[] }[]
> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{
    day_number: number;
    student_id: string;
    status: string;
  }>(
    `
    SELECT day_number, student_id, status FROM attendance
    WHERE batch_id = $1 AND day_number <= $2
    ORDER BY day_number ASC, student_id ASC
    `,
    [batchId, duration],
  );
  const byDay = new Map<
    number,
    { student_id: string; status: string }[]
  >();
  for (let d = 1; d <= duration; d++) byDay.set(d, []);
  for (const r of res.rows) {
    const list = byDay.get(r.day_number) ?? [];
    list.push({ student_id: r.student_id, status: r.status });
    byDay.set(r.day_number, list);
  }
  return Array.from(byDay.entries()).map(([day_number, records]) => ({
    day_number,
    records,
  }));
}
