/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || !String(url).trim()) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const dir = path.join(__dirname, "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const pool = new Pool({ connectionString: url });
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), "utf8");
      console.log("Running", file);
      await pool.query(sql);
    }
    console.log("Migrations complete.");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
