-- Attendance + canonical batch day progression (current_day)

CREATE TABLE IF NOT EXISTS batch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL UNIQUE REFERENCES batches (id) ON DELETE CASCADE,
  current_day INTEGER NOT NULL DEFAULT 1 CHECK (current_day >= 1)
);

CREATE INDEX IF NOT EXISTS idx_batch_progress_batch_id ON batch_progress (batch_id);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(255) NOT NULL,
  batch_id UUID NOT NULL REFERENCES batches (id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1),
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent')),
  marked_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT attendance_student_batch_day_unique UNIQUE (student_id, batch_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_attendance_batch_day ON attendance (batch_id, day_number);
CREATE INDEX IF NOT EXISTS idx_attendance_batch ON attendance (batch_id);

-- Backfill progress rows for existing batches
INSERT INTO batch_progress (batch_id, current_day)
SELECT b.id, GREATEST(1, LEAST(b.unlocked_day, b.duration))
FROM batches b
WHERE NOT EXISTS (SELECT 1 FROM batch_progress bp WHERE bp.batch_id = b.id)
ON CONFLICT (batch_id) DO NOTHING;
