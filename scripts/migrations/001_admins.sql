-- Motiva admin panel: PostgreSQL foundation
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins (email);
