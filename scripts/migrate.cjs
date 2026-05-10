/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Production-safe schema sync.
 *
 * The old custom SQL migration runner used scripts/migrations/*.sql, including
 * a legacy cleanup file that drops the recorded-course tables. The app now uses
 * Prisma as the schema source of truth, so this script deliberately delegates to
 * Prisma and never runs those legacy SQL files.
 */
const { spawnSync } = require("child_process");
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

function run(label, args) {
  console.log(`[db:migrate] ${label}...`);
  const result = spawnSync("npx", args, {
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(`[db:migrate] ${label} failed.`);
    process.exit(result.status ?? 1);
  }
}

function main() {
  loadDatabaseUrlFromEnvFiles();

  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  run("Applying Prisma migrations", ["prisma", "migrate", "deploy"]);
  run("Reconciling Prisma schema", ["prisma", "db", "push", "--skip-generate"]);
  console.log("[db:migrate] Schema is ready.");
}

main();
