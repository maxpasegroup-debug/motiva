-- Courses and lessons (Course has many Lessons)

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(512) NOT NULL,
  description TEXT,
  thumbnail_path TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses (is_published);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  title VARCHAR(512) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  CONSTRAINT lessons_course_sort_unique UNIQUE (course_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons (course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_sort ON lessons (course_id, sort_order);
