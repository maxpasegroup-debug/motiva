import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  hashPin,
  isFourDigitPin,
  issueAuthToken,
  normalizeMobile,
  setAuthCookie,
} from "@/server/auth/unified-auth";

const signupSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    mobile: z.string().transform((value) => normalizeMobile(value)).pipe(
      z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
    ),
    pin: z.string().refine(isFourDigitPin, "PIN must be exactly 4 digits"),
    confirmPin: z
      .string()
      .refine(isFourDigitPin, "PIN must be exactly 4 digits"),
  })
  .refine((value) => value.pin === value.confirmPin, {
    message: "PIN and confirmation do not match",
    path: ["confirmPin"],
  });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, mobile, pin } = parsed.data;

  const existing = await prisma.user.findFirst({ where: { mobile, role: "public" } });
  if (existing) {
    return NextResponse.json(
      { error: "Mobile number already exists" },
      { status: 409 },
    );
  }

  const pinHash = await hashPin(pin);
  const user = await prisma.user.create({
    data: {
      name,
      mobile,
      pin: pinHash,
      role: "public",
      isActive: true,
      pinResetRequired: false,
    },
  });

  const token = issueAuthToken(user);
  const response = NextResponse.json(
    { success: true, role: "public", token },
    { status: 201 },
  );
  setAuthCookie(response, token);
  return response;
}

export const dynamic = "force-dynamic";
