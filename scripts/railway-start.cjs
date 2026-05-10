/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Production entry before `next start`: validates Railway env and pings PostgreSQL.
 * Local dev uses `next dev` (this script is not used).
 */
const { spawnSync } = require("child_process");
const path = require("path");

function required(name) {
  const envValues = {
    JWT_SECRET: process.env.JWT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  };
  const v = envValues[name]?.trim();
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

function runStep(label, command, args) {
  console.log(`[startup] ${label}...`);
  const result = spawnSync(command, args, {
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    console.error(`[startup] ${label} failed.`);
    process.exit(result.status ?? 1);
  }
}

function main() {
  assertProductionEnv();

  if (shouldEnforceProductionChecks()) {
    const verify = path.join(__dirname, "verify-db.cjs");
    runStep("Checking database connection", process.execPath, [
      verify,
      "--connection-only",
    ]);
    runStep("Applying Prisma migrations", "npx", ["prisma", "migrate", "deploy"]);
    runStep("Reconciling Prisma schema", "npx", [
      "prisma",
      "db",
      "push",
      "--skip-generate",
    ]);
    runStep("Verifying database schema", process.execPath, [verify]);
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
