import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_MOBILE = "9946930723";
const ADMIN_PIN = "1234";
const ADMIN_USERNAME = `admin_${ADMIN_MOBILE}`;

async function main() {
  const pinHash = await bcrypt.hash(ADMIN_PIN, 10);

  const admin = await prisma.user.upsert({
    where: {
      username: ADMIN_USERNAME,
    },
    update: {
      name: "Admin",
      mobile: ADMIN_MOBILE,
      pin: pinHash,
      role: "admin",
      isActive: true,
      pinResetRequired: false,
      passwordHash: null,
    },
    create: {
      name: "Admin",
      mobile: ADMIN_MOBILE,
      username: ADMIN_USERNAME,
      pin: pinHash,
      role: "admin",
      isActive: true,
      pinResetRequired: false,
      createdBy: "seed-admin",
    },
    select: {
      id: true,
      name: true,
      mobile: true,
      username: true,
      role: true,
      isActive: true,
    },
  });

  console.log("Admin user ready:", admin);
  console.log(`Login mobile: ${ADMIN_MOBILE}`);
  console.log("Login PIN: [hidden]");
}

main()
  .catch((error) => {
    console.error("Failed to seed admin user:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
