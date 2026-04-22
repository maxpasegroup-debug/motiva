import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { getBearerToken } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";
import prisma from "@/lib/prisma";

const USER_AUTH_COOKIE = "motiva_user_auth";
const PIN_RE = /^\d{4}$/;

function getSessionToken(req: NextRequest): string | null {
  const bearer = getBearerToken(req);
  if (bearer) return bearer;
  return req.cookies.get(USER_AUTH_COOKIE)?.value ?? null;
}

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
  const currentPin = typeof o.currentPin === "string" ? o.currentPin : "";
  const newPin = typeof o.newPin === "string" ? o.newPin : "";
  const confirmPin = typeof o.confirmPin === "string" ? o.confirmPin : "";

  if (!currentPin || !PIN_RE.test(newPin) || newPin !== confirmPin) {
    return NextResponse.json({ error: "Invalid PIN details" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, pin: true },
  });
  if (!user || !user.pin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ok = await bcrypt.compare(currentPin, user.pin);
  if (!ok) {
    return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 401 });
  }

  const nextPinHash = await bcrypt.hash(newPin, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      pin: nextPinHash,
      pinResetRequired: false,
    },
  });

  return NextResponse.json({ success: true });
}
