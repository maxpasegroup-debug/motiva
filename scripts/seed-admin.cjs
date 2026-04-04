/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Inserts or updates the initial Motiva admin in PostgreSQL.
 * Requires DATABASE_URL (or define it in .env.local / .env).
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const ADMIN_EMAIL = "admin@motiva.com";
const ADMIN_PASSWORD = "Admin@123";

function loadDatabaseUrlFromEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const p = path.join(process.cwd(), name);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key === "DATABASE_URL" && val && !process.env.DATABASE_URL) {
        process.env.DATABASE_URL = val;
      }
    }
  }
}

async function main() {
  loadDatabaseUrlFromEnvFiles();

  const url = process.env.DATABASE_URL;
  if (!url || !String(url).trim()) {
    console.error(
      "DATABASE_URL is not set. Add it to the environment or .env.local, then retry.",
    );
    process.exit(1);
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'admin'
      )
    `);

    const result = await pool.query(
      `
      INSERT INTO admins (email, password_hash, role)
      VALUES ($1, $2, 'admin')
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'admin'
      RETURNING id, email, role
      `,
      [email, passwordHash],
    );

    const row = result.rows[0];
    console.log("Admin ready:", {
      id: row.id,
      email: row.email,
      role: row.role,
    });
    console.log("Login with:", ADMIN_EMAIL, "/", ADMIN_PASSWORD);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
