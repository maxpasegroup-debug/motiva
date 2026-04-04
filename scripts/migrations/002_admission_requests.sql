CREATE TABLE IF NOT EXISTS admission_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name VARCHAR(255) NOT NULL,
  parent_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  program_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT admission_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_admission_requests_status ON admission_requests (status);
CREATE INDEX IF NOT EXISTS idx_admission_requests_created_at ON admission_requests (created_at DESC);
