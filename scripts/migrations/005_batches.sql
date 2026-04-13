-- Foundation batches: teacher, duration, roster (student auth user ids). No LMS course link.

CREATE TABLE IF NOT EXISTS batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(512) NOT NULL,
  teacher_id VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL CHECK (duration IN (12, 25)),
  start_date DATE,
  unlocked_day INTEGER NOT NULL DEFAULT 1,
  completed_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_teacher_id ON batches (teacher_id);

CREATE TABLE IF NOT EXISTS batch_students (
  student_id VARCHAR(255) NOT NULL PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batches (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_batch_students_batch_id ON batch_students (batch_id);
