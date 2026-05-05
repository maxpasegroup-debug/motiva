import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/server/auth/require-admin";

const PIN_RE = /^\d{4}$/;

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

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

  if (!PIN_RE.test(currentPin) || !PIN_RE.test(newPin) || newPin !== confirmPin) {
    return NextResponse.json({ error: "Invalid PIN details" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.payload.sub },
    select: { id: true, role: true, pin: true },
  });

  if (!user || user.role !== "admin" || !user.pin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ok = await bcrypt.compare(currentPin, user.pin);
  if (!ok) {
    return NextResponse.json({ error: "Current PIN is incorrect" }, { status: 401 });
  }

  const pinHash = await bcrypt.hash(newPin, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      pin: pinHash,
      passwordHash: null,
      pinResetRequired: false,
    },
  });

  return NextResponse.json({ success: true });
}

export const dynamic = "force-dynamic";
