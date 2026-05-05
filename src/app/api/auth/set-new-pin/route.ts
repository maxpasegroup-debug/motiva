import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionToken } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";
import { hashPin, isFourDigitPin } from "@/server/auth/unified-auth";

export async function POST(req: NextRequest) {
  const token = getSessionToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ReturnType<typeof verifyJwt>;
  try {
    payload = verifyJwt(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const newPin = typeof o.newPin === "string" ? o.newPin : "";
  const confirmPin = typeof o.confirmPin === "string" ? o.confirmPin : newPin;

  if (!isFourDigitPin(newPin) || newPin !== confirmPin) {
    return NextResponse.json({ error: "Invalid PIN details" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      pin: await hashPin(newPin),
      pinResetRequired: false,
    },
  });

  return NextResponse.json({ success: true });
}

export const dynamic = "force-dynamic";
