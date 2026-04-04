/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Production entry before `next start`: validates Railway env and pings PostgreSQL.
 * Local dev uses `next dev` (this script is not used).
 */
const { spawnSync } = require("child_process");
const path = require("path");

function required(name) {
  const v = process.env[name]?.trim();
  if (!v) {
    console.error(
      `[env] ${name} is missing or empty. Set it in Railway Variables (see .env.example).`,
    );
    process.exit(1);
  }
  return v;
}

function shouldEnforceProductionChecks() {
  return (
    process.env.NODE_ENV === "production" ||
    typeof process.env.RAILWAY_ENVIRONMENT === "string"
  );
}

function assertProductionEnv() {
  if (!shouldEnforceProductionChecks()) return;

  required("JWT_SECRET");
  required("DATABASE_URL");
  required("NEXTAUTH_SECRET");
  const nextAuthUrl = required("NEXTAUTH_URL");
  if (!nextAuthUrl.startsWith("https://")) {
    console.error(
      "[env] NEXTAUTH_URL must start with https:// in production (your public Railway URL).",
    );
    process.exit(1);
  }
}

function main() {
  assertProductionEnv();

  if (shouldEnforceProductionChecks()) {
    const verify = path.join(__dirname, "verify-db.cjs");
    const db = spawnSync(process.execPath, [verify], {
      env: process.env,
      stdio: "inherit",
    });
    if (db.status !== 0) {
      process.exit(db.status ?? 1);
    }
  }

  const nextCli = path.join(
    __dirname,
    "..",
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  const start = spawnSync(process.execPath, [nextCli, "start"], {
    stdio: "inherit",
    env: process.env,
  });
  process.exit(start.status ?? 1);
}

main();
