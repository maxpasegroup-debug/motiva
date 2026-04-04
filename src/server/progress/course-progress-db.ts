import { getPool } from "@/server/db/pool";
import { ensureCourseTables } from "@/server/courses/courses-db";

let tableReady: Promise<void> | null = null;

async function ensureCourseProgressTable(): Promise<void> {
  await ensureCourseTables();
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id VARCHAR(255) NOT NULL,
      course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
      lesson_id UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
      last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      furthest_completed_order INTEGER NOT NULL DEFAULT -1,
      CONSTRAINT course_progress_student_course_unique UNIQUE (student_id, course_id)
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_course_progress_student ON course_progress (student_id)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_course_progress_course ON course_progress (course_id)`,
  );
}

function ensureTables(): Promise<void> {
  if (!tableReady) {
    tableReady = ensureCourseProgressTable();
  }
  return tableReady;
}

export type CourseProgressRow = {
  id: string;
  student_id: string;
  course_id: string;
  lesson_id: string;
  last_watched_at: Date;
  completed: boolean;
  furthest_completed_order: number;
};

export async function getLessonOrderInCourse(
  courseId: string,
  lessonId: string,
): Promise<number | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{ sort_order: number }>(
    `
    SELECT sort_order FROM lessons
    WHERE course_id = $1 AND id = $2
    `,
    [courseId, lessonId],
  );
  const row = res.rows[0];
  return row ? row.sort_order : null;
}

export async function getCourseProgress(
  studentId: string,
  courseId: string,
): Promise<CourseProgressRow | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<CourseProgressRow>(
    `
    SELECT id, student_id, course_id, lesson_id, last_watched_at, completed, furthest_completed_order
    FROM course_progress
    WHERE student_id = $1 AND course_id = $2
    `,
    [studentId, courseId],
  );
  return res.rows[0] ?? null;
}

export async function upsertCourseProgress(input: {
  studentId: string;
  courseId: string;
  lessonId: string;
  markComplete?: boolean;
}): Promise<CourseProgressRow> {
  await ensureTables();
  const order = await getLessonOrderInCourse(input.courseId, input.lessonId);
  if (order === null) {
    throw new Error("Lesson not in course");
  }

  const pool = getPool();
  const markComplete = input.markComplete === true;
  const res = await pool.query<CourseProgressRow>(
    `
    INSERT INTO course_progress (
      student_id, course_id, lesson_id, last_watched_at, completed, furthest_completed_order
    )
    VALUES ($1, $2, $3, NOW(), $4,
      CASE WHEN $4 THEN $5 ELSE -1 END
    )
    ON CONFLICT (student_id, course_id) DO UPDATE SET
      lesson_id = EXCLUDED.lesson_id,
      last_watched_at = NOW(),
      completed = CASE WHEN $4 THEN TRUE ELSE FALSE END,
      furthest_completed_order = CASE
        WHEN $4 THEN GREATEST(course_progress.furthest_completed_order, $5)
        ELSE course_progress.furthest_completed_order
      END
    RETURNING id, student_id, course_id, lesson_id, last_watched_at, completed, furthest_completed_order
    `,
    [
      input.studentId,
      input.courseId,
      input.lessonId,
      markComplete,
      order,
    ],
  );
  const row = res.rows[0];
  if (!row) throw new Error("Upsert course progress failed");
  return row;
}

export type StudentCourseProgressSummary = {
  course_id: string;
  title: string;
  thumbnail_path: string | null;
  total_lessons: number;
  lesson_id: string | null;
  furthest_completed_order: number | null;
  last_watched_at: string | null;
};

export async function listPublishedCoursesWithProgress(
  studentId: string,
): Promise<StudentCourseProgressSummary[]> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{
    course_id: string;
    title: string;
    thumbnail_path: string | null;
    total_lessons: string;
    lesson_id: string | null;
    furthest_completed_order: number | null;
    last_watched_at: Date | null;
  }>(
    `
    SELECT
      c.id AS course_id,
      c.title,
      c.thumbnail_path,
      (SELECT COUNT(*)::text FROM lessons l WHERE l.course_id = c.id) AS total_lessons,
      cp.lesson_id,
      cp.furthest_completed_order,
      cp.last_watched_at
    FROM courses c
    LEFT JOIN course_progress cp
      ON cp.course_id = c.id AND cp.student_id = $1
    WHERE c.is_published = TRUE
    ORDER BY c.created_at DESC
    `,
    [studentId],
  );

  return res.rows.map((r) => ({
    course_id: r.course_id,
    title: r.title,
    thumbnail_path: r.thumbnail_path,
    total_lessons: Number(r.total_lessons) || 0,
    lesson_id: r.lesson_id,
    furthest_completed_order: r.furthest_completed_order,
    last_watched_at: r.last_watched_at
      ? r.last_watched_at.toISOString()
      : null,
  }));
}
