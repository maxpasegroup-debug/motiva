/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Standalone PostgreSQL ping (used by production instrumentation).
 * Avoids bundling `pg` into the Next.js compiler graph.
 */
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

function loadDatabaseUrlFromEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const filePath = path.join(process.cwd(), name);
    if (!fs.existsSync(filePath)) continue;
    const text = fs.readFileSync(filePath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

async function main() {
  loadDatabaseUrlFromEnvFiles();

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("[env] DATABASE_URL is not set.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });
  try {
    await pool.query("SELECT 1");
    console.log("[env] Database connection OK.");
    if (process.argv.includes("--connection-only")) {
      return;
    }
    const requiredTables = [
      "admins",
      "users",
      "courses",
      "teachers",
      "enquiries",
      "leads",
      "student_accounts",
      "parent_accounts",
      "learning_plans",
      "payment_transactions",
    ];
    const missing = [];
    for (const table of requiredTables) {
      const result = await pool.query("SELECT to_regclass($1) AS table_name", [
        `public.${table}`,
      ]);
      if (!result.rows[0]?.table_name) {
        missing.push(table);
      }
    }
    if (missing.length > 0) {
      console.error(`[env] Database schema missing tables: ${missing.join(", ")}.`);
      process.exit(1);
    }
    console.log("[env] Database schema OK.");
  } catch (e) {
    console.error("[env] Database connection failed:", e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
