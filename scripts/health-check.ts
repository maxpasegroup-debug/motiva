import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CheckResult = {
  name: string;
  pass: boolean;
  details?: string;
};

function printResult(result: CheckResult) {
  const status = result.pass ? "PASS" : "FAIL";
  const details = result.details ? ` - ${result.details}` : "";
  console.log(`${status} ${result.name}${details}`);
}

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

async function run() {
  const results: CheckResult[] = [];

  try {
    await prisma.$queryRaw`SELECT 1`;
    results.push({ name: "Database connection", pass: true });
  } catch (error) {
    results.push({
      name: "Database connection",
      pass: false,
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }

  results.push({
    name: "Razorpay credentials",
    pass: hasEnv("RAZORPAY_KEY_ID") && hasEnv("RAZORPAY_KEY_SECRET"),
    details: "Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET",
  });

  results.push({
    name: "WhatsApp credentials",
    pass:
      hasEnv("WHATSAPP_PHONE_NUMBER_ID") && hasEnv("WHATSAPP_ACCESS_TOKEN"),
    details: "Requires WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN",
  });

  results.push({
    name: "Cloudinary credentials",
    pass:
      hasEnv("CLOUDINARY_CLOUD_NAME") &&
      hasEnv("CLOUDINARY_API_KEY") &&
      hasEnv("CLOUDINARY_API_SECRET"),
    details:
      "Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET",
  });

  const jwtSecret = process.env.JWT_SECRET?.trim() ?? "";
  results.push({
    name: "JWT secret",
    pass: jwtSecret.length >= 32,
    details: "JWT_SECRET must be at least 32 characters",
  });

  results.forEach(printResult);

  const hasFailures = results.some((result) => !result.pass);
  await prisma.$disconnect();
  process.exit(hasFailures ? 1 : 0);
}

void run();
