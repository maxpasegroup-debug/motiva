import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";

function normalizeMobile(input: string): string {
  return input.replace(/\D/g, "");
}

function generateTempPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const signupSchema = z.object({
  name: z.string().trim().min(2).max(100),
  mobile: z.string().transform((value) => normalizeMobile(value)).pipe(
    z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
  ),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { name, mobile } = parsed.data;

  const tempPin = generateTempPin();
  const pinHash = await bcrypt.hash(tempPin, 10);

  const email = `public-${mobile}@motiva.local`;

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        pin: pinHash,
        passwordHash: pinHash,
        role: "public",
      },
    });
  } catch {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
export const dynamic = "force-dynamic";
