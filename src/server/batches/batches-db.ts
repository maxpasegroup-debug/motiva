import { getPool } from "@/server/db/pool";
import { ensureCourseTables } from "@/server/courses/courses-db";

let tableReady: Promise<void> | null = null;

async function ensureBatchesTables(): Promise<void> {
  await ensureCourseTables();
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS batches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(512) NOT NULL,
      course_id UUID NOT NULL REFERENCES courses (id) ON DELETE RESTRICT,
      teacher_id VARCHAR(255) NOT NULL,
      duration INTEGER NOT NULL CHECK (duration IN (12, 25)),
      start_date DATE,
      unlocked_day INTEGER NOT NULL DEFAULT 1,
      completed_days INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_batches_course_id ON batches (course_id)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_batches_teacher_id ON batches (teacher_id)`,
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS batch_students (
      student_id VARCHAR(255) NOT NULL PRIMARY KEY,
      batch_id UUID NOT NULL REFERENCES batches (id) ON DELETE CASCADE
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_batch_students_batch_id ON batch_students (batch_id)`,
  );
}

function ensureTables(): Promise<void> {
  if (!tableReady) {
    tableReady = ensureBatchesTables();
  }
  return tableReady;
}

export function ensureBatchesDbTables(): Promise<void> {
  return ensureTables();
}

export type BatchRow = {
  id: string;
  name: string;
  course_id: string;
  teacher_id: string;
  duration: 12 | 25;
  start_date: Date | null;
  unlocked_day: number;
  completed_days: number;
  created_at: Date;
};

export async function insertBatch(input: {
  name: string;
  course_id: string;
  teacher_id: string;
  duration: 12 | 25;
  start_date?: string | null;
}): Promise<{ id: string }> {
  await ensureTables();
  const pool = getPool();
  const start =
    input.start_date && input.start_date.trim()
      ? input.start_date.trim()
      : null;
  const res = await pool.query<{ id: string }>(
    `
    INSERT INTO batches (name, course_id, teacher_id, duration, start_date)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [
      input.name.trim(),
      input.course_id,
      input.teacher_id,
      input.duration,
      start,
    ],
  );
  const row = res.rows[0];
  if (!row?.id) throw new Error("Insert batch failed");
  const { createBatchProgress } = await import("@/server/attendance/attendance-db");
  await createBatchProgress(row.id);
  return { id: row.id };
}

export async function updateBatch(
  id: string,
  patch: {
    name?: string;
    course_id?: string;
    teacher_id?: string;
    duration?: 12 | 25;
    start_date?: string | null;
  },
): Promise<boolean> {
  await ensureTables();
  const parts: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (patch.name !== undefined) {
    parts.push(`name = $${i++}`);
    vals.push(patch.name.trim());
  }
  if (patch.course_id !== undefined) {
    parts.push(`course_id = $${i++}`);
    vals.push(patch.course_id);
  }
  if (patch.teacher_id !== undefined) {
    parts.push(`teacher_id = $${i++}`);
    vals.push(patch.teacher_id);
  }
  if (patch.duration !== undefined) {
    parts.push(`duration = $${i++}`);
    vals.push(patch.duration);
  }
  if (patch.start_date !== undefined) {
    parts.push(`start_date = $${i++}`);
    vals.push(
      patch.start_date && patch.start_date.trim()
        ? patch.start_date.trim()
        : null,
    );
  }
  if (parts.length === 0) return false;
  vals.push(id);
  const pool = getPool();
  const res = await pool.query(
    `UPDATE batches SET ${parts.join(", ")} WHERE id = $${i}`,
    vals,
  );
  return (res.rowCount ?? 0) > 0;
}

export async function deleteBatchById(id: string): Promise<boolean> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query(`DELETE FROM batches WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function getBatchById(id: string): Promise<BatchRow | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<BatchRow>(
    `
    SELECT id, name, course_id, teacher_id, duration, start_date, unlocked_day, completed_days, created_at
    FROM batches WHERE id = $1
    `,
    [id],
  );
  return res.rows[0] ?? null;
}

export type BatchAdminListRow = BatchRow & {
  student_count: number;
  course_title: string;
};

export async function listBatchesAdmin(): Promise<BatchAdminListRow[]> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<BatchAdminListRow & { student_count: string }>(
    `
    SELECT
      b.id, b.name, b.course_id, b.teacher_id, b.duration, b.start_date,
      b.unlocked_day, b.completed_days, b.created_at,
      c.title AS course_title,
      (SELECT COUNT(*)::text FROM batch_students bs WHERE bs.batch_id = b.id) AS student_count
    FROM batches b
    JOIN courses c ON c.id = b.course_id
    ORDER BY b.created_at DESC
    `,
  );
  return res.rows.map((r) => ({
    ...r,
    student_count: Number(r.student_count) || 0,
  }));
}

export async function listBatchesForTeacher(
  teacherId: string,
): Promise<BatchAdminListRow[]> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<BatchAdminListRow & { student_count: string }>(
    `
    SELECT
      b.id, b.name, b.course_id, b.teacher_id, b.duration, b.start_date,
      b.unlocked_day, b.completed_days, b.created_at,
      c.title AS course_title,
      (SELECT COUNT(*)::text FROM batch_students bs WHERE bs.batch_id = b.id) AS student_count
    FROM batches b
    JOIN courses c ON c.id = b.course_id
    WHERE b.teacher_id = $1
    ORDER BY b.created_at DESC
    `,
    [teacherId],
  );
  return res.rows.map((r) => ({
    ...r,
    student_count: Number(r.student_count) || 0,
  }));
}

export async function getBatchStudentIds(batchId: string): Promise<string[]> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{ student_id: string }>(
    `SELECT student_id FROM batch_students WHERE batch_id = $1 ORDER BY student_id`,
    [batchId],
  );
  return res.rows.map((r) => r.student_id);
}

export async function setBatchStudents(
  batchId: string,
  studentIds: string[],
): Promise<void> {
  await ensureTables();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const ids = Array.from(
      new Set(studentIds.map((x) => x.trim()).filter(Boolean)),
    );
    if (ids.length > 0) {
      await client.query(
        `DELETE FROM batch_students WHERE student_id = ANY($1::varchar[])`,
        [ids],
      );
    }
    await client.query(`DELETE FROM batch_students WHERE batch_id = $1`, [
      batchId,
    ]);
    for (const sid of ids) {
      await client.query(
        `INSERT INTO batch_students (student_id, batch_id) VALUES ($1, $2)`,
        [sid, batchId],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getStudentBatchRow(
  studentId: string,
): Promise<(BatchRow & { course_title: string }) | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<BatchRow & { course_title: string }>(
    `
    SELECT
      b.id, b.name, b.course_id, b.teacher_id, b.duration, b.start_date,
      b.unlocked_day, b.completed_days, b.created_at,
      c.title AS course_title
    FROM batch_students bs
    JOIN batches b ON b.id = bs.batch_id
    JOIN courses c ON c.id = b.course_id
    WHERE bs.student_id = $1
    LIMIT 1
    `,
    [studentId],
  );
  return res.rows[0] ?? null;
}

export async function studentHasCourseAccess(
  studentId: string,
  courseId: string,
): Promise<boolean> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{ ok: string }>(
    `
    SELECT '1' AS ok
    FROM batch_students bs
    JOIN batches b ON b.id = bs.batch_id
    WHERE bs.student_id = $1 AND b.course_id = $2
    LIMIT 1
    `,
    [studentId, courseId],
  );
  return !!res.rows[0];
}

export async function verifyTeacherOwnsBatch(
  batchId: string,
  teacherId: string,
): Promise<BatchRow | null> {
  const b = await getBatchById(batchId);
  if (!b || b.teacher_id !== teacherId) return null;
  return b;
}

export async function teacherMarkDayComplete(
  batchId: string,
  teacherId: string,
): Promise<BatchRow | null> {
  const b = await verifyTeacherOwnsBatch(batchId, teacherId);
  if (!b) return null;
  const d = b.duration as 12 | 25;
  if (b.completed_days >= d) return b;
  if (b.completed_days >= b.unlocked_day) return b;
  const c = b.completed_days + 1;
  const pool = getPool();
  await pool.query(`UPDATE batches SET completed_days = $2 WHERE id = $1`, [
    batchId,
    c,
  ]);
  return (await getBatchById(batchId)) ?? null;
}

export async function teacherUnlockNextDay(
  batchId: string,
  teacherId: string,
): Promise<BatchRow | null> {
  const b = await verifyTeacherOwnsBatch(batchId, teacherId);
  if (!b) return null;
  const d = b.duration as 12 | 25;
  if (b.unlocked_day >= d) return b;
  if (b.completed_days < b.unlocked_day) return b;
  const u = Math.min(b.unlocked_day + 1, d);
  const pool = getPool();
  await pool.query(`UPDATE batches SET unlocked_day = $2 WHERE id = $1`, [
    batchId,
    u,
  ]);
  return (await getBatchById(batchId)) ?? null;
}
