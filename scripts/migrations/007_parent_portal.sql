-- Parent portal: profile link, notifications, server-side payment flag for parent view.

CREATE TABLE IF NOT EXISTS parents (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  phone_normalized VARCHAR(32) NOT NULL,
  student_id VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parents_phone_norm ON parents (phone_normalized);
CREATE INDEX IF NOT EXISTS idx_parents_email_lower ON parents (LOWER(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS parent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id VARCHAR(255) NOT NULL REFERENCES parents (id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_parent_notifications_parent ON parent_notifications (parent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS student_payment_status (
  student_id VARCHAR(255) PRIMARY KEY,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
