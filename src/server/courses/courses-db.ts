import { getPool } from "@/server/db/pool";

let tableReady: Promise<void> | null = null;

async function ensureCoursesAndLessonsTables(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(512) NOT NULL,
      description TEXT,
      thumbnail_path TEXT,
      is_published BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses (created_at DESC)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses (is_published)`,
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
      title VARCHAR(512) NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
      CONSTRAINT lessons_course_sort_unique UNIQUE (course_id, sort_order)
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons (course_id)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_lessons_course_sort ON lessons (course_id, sort_order)`,
  );
}

function ensureTables(): Promise<void> {
  if (!tableReady) {
    tableReady = ensureCoursesAndLessonsTables();
  }
  return tableReady;
}

/** Ensures `courses` and `lessons` exist (e.g. before `course_progress`). */
export function ensureCourseTables(): Promise<void> {
  return ensureTables();
}

/** DB row: `courses` */
export type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_path: string | null;
  is_published: boolean;
  created_at: Date;
};

/** DB row: `lessons` — `sort_order` is the lesson sequence (0, 1, 2, …). */
export type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string;
  sort_order: number;
};

export type CourseWithLessons = CourseRow & {
  lessons: LessonRow[];
};

export async function insertCourse(input: {
  title: string;
  description?: string | null;
  thumbnail_path?: string | null;
  is_published?: boolean;
}): Promise<{ id: string }> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{ id: string }>(
    `
    INSERT INTO courses (title, description, thumbnail_path, is_published)
    VALUES ($1, $2, $3, COALESCE($4, FALSE))
    RETURNING id
    `,
    [
      input.title.trim(),
      input.description?.trim() || null,
      input.thumbnail_path?.trim() || null,
      input.is_published ?? false,
    ],
  );
  const row = res.rows[0];
  if (!row?.id) throw new Error("Insert course failed");
  return { id: row.id };
}

export async function insertLesson(input: {
  course_id: string;
  title: string;
  description?: string | null;
  video_url: string;
  /** Display / sequence order: 0 = first lesson (e.g. intro). */
  sort_order: number;
}): Promise<{ id: string }> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{ id: string }>(
    `
    INSERT INTO lessons (course_id, title, description, video_url, sort_order)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [
      input.course_id,
      input.title.trim(),
      input.description?.trim() || null,
      input.video_url.trim(),
      input.sort_order,
    ],
  );
  const row = res.rows[0];
  if (!row?.id) throw new Error("Insert lesson failed");
  return { id: row.id };
}

export async function listCourses(
  options: { publishedOnly?: boolean } = {},
): Promise<CourseRow[]> {
  await ensureTables();
  const pool = getPool();
  const publishedOnly = options.publishedOnly === true;
  const res = await pool.query<CourseRow>(
    publishedOnly
      ? `
        SELECT id, title, description, thumbnail_path, is_published, created_at
        FROM courses
        WHERE is_published = TRUE
        ORDER BY created_at DESC
        `
      : `
        SELECT id, title, description, thumbnail_path, is_published, created_at
        FROM courses
        ORDER BY created_at DESC
        `,
  );
  return res.rows;
}

export async function getCourseById(id: string): Promise<CourseRow | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<CourseRow>(
    `
    SELECT id, title, description, thumbnail_path, is_published, created_at
    FROM courses
    WHERE id = $1
    `,
    [id],
  );
  return res.rows[0] ?? null;
}

export async function listLessonsForCourse(
  courseId: string,
): Promise<LessonRow[]> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<LessonRow>(
    `
    SELECT id, course_id, title, description, video_url, sort_order
    FROM lessons
    WHERE course_id = $1
    ORDER BY sort_order ASC
    `,
    [courseId],
  );
  return res.rows;
}

export async function getCourseWithLessons(
  id: string,
): Promise<CourseWithLessons | null> {
  const course = await getCourseById(id);
  if (!course) return null;
  const lessons = await listLessonsForCourse(id);
  return { ...course, lessons };
}

export async function setCoursePublished(
  id: string,
  is_published: boolean,
): Promise<boolean> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query(
    `UPDATE courses SET is_published = $2 WHERE id = $1`,
    [id, is_published],
  );
  return (res.rowCount ?? 0) > 0;
}

export type PublishLessonInput = {
  title: string;
  description?: string | null;
  video_url: string;
  /** Lesson sequence (0, 1, 2, …) — stored as `sort_order`. */
  order: number;
};

/**
 * Insert course (unpublished), insert all lessons, then set `is_published = true`.
 * Rolls back the whole transaction on any failure.
 */
export async function publishCourseWithLessons(input: {
  title: string;
  description?: string | null;
  thumbnail_path?: string | null;
  lessons: PublishLessonInput[];
}): Promise<CourseWithLessons> {
  await ensureTables();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ins = await client.query<CourseRow>(
      `
      INSERT INTO courses (title, description, thumbnail_path, is_published)
      VALUES ($1, $2, $3, FALSE)
      RETURNING id, title, description, thumbnail_path, is_published, created_at
      `,
      [
        input.title.trim(),
        input.description?.trim() ?? null,
        input.thumbnail_path?.trim() ?? null,
      ],
    );
    const row = ins.rows[0];
    if (!row?.id) {
      throw new Error("Insert course failed");
    }

    const sorted = [...input.lessons].sort((a, b) => a.order - b.order);
    for (const L of sorted) {
      await client.query(
        `
        INSERT INTO lessons (course_id, title, description, video_url, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          row.id,
          L.title.trim(),
          L.description?.trim() ?? null,
          L.video_url.trim(),
          L.order,
        ],
      );
    }

    await client.query(`UPDATE courses SET is_published = TRUE WHERE id = $1`, [
      row.id,
    ]);

    await client.query("COMMIT");

    const course = await getCourseById(row.id);
    if (!course) {
      throw new Error("Course missing after publish");
    }
    const lessons = await listLessonsForCourse(row.id);
    return { ...course, lessons };
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw e;
  } finally {
    client.release();
  }
}

export type CourseListRow = CourseRow & {
  lesson_count: number;
};

export async function listCoursesWithLessonCounts(options: {
  publishedOnly?: boolean;
} = {}): Promise<CourseListRow[]> {
  await ensureTables();
  const pool = getPool();
  const publishedOnly = options.publishedOnly === true;
  const res = await pool.query<
    CourseRow & { lesson_count: string | number }
  >(
    `
    SELECT
      c.id,
      c.title,
      c.description,
      c.thumbnail_path,
      c.is_published,
      c.created_at,
      COALESCE(
        (SELECT COUNT(*)::int FROM lessons l WHERE l.course_id = c.id),
        0
      ) AS lesson_count
    FROM courses c
    ${publishedOnly ? "WHERE c.is_published = TRUE" : ""}
    ORDER BY c.created_at DESC
    `,
  );
  return res.rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    thumbnail_path: r.thumbnail_path,
    is_published: r.is_published,
    created_at:
      r.created_at instanceof Date ? r.created_at : new Date(r.created_at),
    lesson_count: Number(r.lesson_count),
  }));
}

export async function updateCourse(
  id: string,
  patch: {
    title?: string;
    description?: string | null;
    thumbnail_path?: string | null;
    is_published?: boolean;
  },
): Promise<boolean> {
  await ensureTables();
  const parts: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (patch.title !== undefined) {
    parts.push(`title = $${i++}`);
    vals.push(patch.title.trim());
  }
  if (patch.description !== undefined) {
    parts.push(`description = $${i++}`);
    vals.push(
      patch.description === null || patch.description === ""
        ? null
        : patch.description.trim(),
    );
  }
  if (patch.thumbnail_path !== undefined) {
    parts.push(`thumbnail_path = $${i++}`);
    vals.push(
      patch.thumbnail_path === null || patch.thumbnail_path === ""
        ? null
        : patch.thumbnail_path.trim(),
    );
  }
  if (patch.is_published !== undefined) {
    parts.push(`is_published = $${i++}`);
    vals.push(patch.is_published);
  }
  if (parts.length === 0) return true;
  vals.push(id);
  const pool = getPool();
  const res = await pool.query(
    `UPDATE courses SET ${parts.join(", ")} WHERE id = $${i}`,
    vals,
  );
  return (res.rowCount ?? 0) > 0;
}

export async function deleteCourseById(id: string): Promise<boolean> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query(`DELETE FROM courses WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}
