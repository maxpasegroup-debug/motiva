import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MOBILE_RE = /^\d{10}$/;

function normalizeMobile(input: string): string {
  return input.replace(/\D/g, "");
}

function generateTempPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

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

  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const mobileRaw = typeof o.mobile === "string" ? o.mobile : "";
  const mobile = normalizeMobile(mobileRaw);

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!MOBILE_RE.test(mobile)) {
    return NextResponse.json({ error: "mobile must be 10 digits" }, { status: 400 });
  }

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
