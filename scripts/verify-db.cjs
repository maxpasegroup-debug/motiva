/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Standalone PostgreSQL ping (used by production instrumentation).
 * Avoids bundling `pg` into the Next.js compiler graph.
 */
const { Pool } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("[env] DATABASE_URL is not set.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query("SELECT 1");
    console.log("[env] Database connection OK.");
  } catch (e) {
    console.error("[env] Database connection failed:", e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
