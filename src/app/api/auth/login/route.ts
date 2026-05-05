import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  comparePin,
  isFourDigitPin,
  issueAuthToken,
  normalizeMobile,
  setAuthCookie,
} from "@/server/auth/unified-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z
  .object({
    mobile: z.string().optional(),
    pin: z.string().optional(),
    login: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  })
  .transform((value) => ({
    mobile: normalizeMobile(value.mobile ?? value.login ?? value.username ?? ""),
    pin: value.pin ?? value.password ?? "",
  }))
  .pipe(
    z.object({
      mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
      pin: z.string().refine(isFourDigitPin, "PIN must be exactly 4 digits"),
    }),
  );

function invalidLogin() {
  return NextResponse.json(
    { error: "Invalid mobile number or PIN" },
    { status: 401 },
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { mobile, pin } = parsed.data;

  const users = await prisma.user.findMany({
    where: { mobile, isActive: true },
    orderBy: { createdAt: "asc" },
  });
  const matches = [];
  for (const candidate of users) {
    if (await comparePin(pin, candidate.pin)) {
      matches.push(candidate);
    }
  }
  const user = matches[0] ?? null;
  if (!user || matches.length > 1) {
    return invalidLogin();
  }

  const token = issueAuthToken(user);

  if (user.pinResetRequired) {
    const response = NextResponse.json({
      requiresPinReset: true,
      role: user.role,
      token,
    });
    setAuthCookie(response, token);
    return response;
  }

  const response = NextResponse.json({
    success: true,
    role: user.role,
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      mobile: user.mobile,
    },
    token,
  });
  setAuthCookie(response, token);
  return response;
}
