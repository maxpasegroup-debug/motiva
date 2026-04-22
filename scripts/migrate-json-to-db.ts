import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  passwordHash: string;
  role: string;
};

type StoredProgram = {
  id: string;
  title: string;
  description?: string;
  image_path?: string;
  image_url?: string;
  is_active: boolean;
};

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), "data");

function readJsonArray(fileName: string): unknown[] {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`[skip] ${fileName} not found.`);
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    console.log(`[skip] ${fileName} has invalid JSON.`);
    return [];
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.email === "string" &&
    typeof row.passwordHash === "string" &&
    typeof row.role === "string"
  );
}

function isStoredProgram(value: unknown): value is StoredProgram {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    typeof row.is_active === "boolean" &&
    (typeof row.image_path === "string" || typeof row.image_url === "string")
  );
}

async function migrateUsers() {
  const rows = readJsonArray("auth-users.json").filter(isAuthUser);
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const existing = await prisma.user.findUnique({ where: { id: row.id } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.user.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        name: row.name.trim(),
        email: row.email.trim().toLowerCase(),
        phone: row.phone?.trim() || null,
        passwordHash: row.passwordHash,
        role: row.role,
      },
      update: {},
    });
    inserted++;
  }

  console.log(
    `users: inserted=${inserted}, skipped=${skipped}, total=${rows.length}`,
  );
}

async function migratePrograms() {
  const rows = readJsonArray("programs.json").filter(isStoredProgram);
  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const existing = await prisma.program.findUnique({ where: { id: row.id } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.program.upsert({
      where: { id: row.id },
      create: {
        id: row.id,
        title: row.title.trim(),
        description: (row.description ?? "").trim(),
        imagePath: (row.image_path ?? row.image_url ?? "").trim(),
        isActive: row.is_active,
      },
      update: {},
    });
    inserted++;
  }

  console.log(
    `programs: inserted=${inserted}, skipped=${skipped}, total=${rows.length}`,
  );
}

async function main() {
  await migrateUsers();
  await migratePrograms();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
