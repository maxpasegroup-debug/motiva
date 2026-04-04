-- Per-student course progress (one row per student + course).
-- furthest_completed_order: max lesson sort_order marked complete (video ended); unlock <= +1.

CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(255) NOT NULL,
  course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  furthest_completed_order INTEGER NOT NULL DEFAULT -1,
  CONSTRAINT course_progress_student_course_unique UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_course_progress_student ON course_progress (student_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course ON course_progress (course_id);
