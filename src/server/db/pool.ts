import { Pool } from "pg";

let pool: Pool | null = null;

export function getDatabaseUrl(): string | null {
  const url = process.env.DATABASE_URL;
  return url && url.trim() ? url.trim() : null;
}

export function getPool(): Pool {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "[env] DATABASE_URL is not set. Set it on Railway or in .env / .env.local (see .env.example).",
    );
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}
