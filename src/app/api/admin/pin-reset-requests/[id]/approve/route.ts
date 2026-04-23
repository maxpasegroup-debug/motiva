import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/require-admin";
import prisma from "@/lib/prisma";

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const request = await prisma.pinResetRequest.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!request || request.status !== "pending") {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const plainPin = generatePin();
  const pinHash = await bcrypt.hash(plainPin, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: request.userId },
      data: {
        pin: pinHash,
        pinResetRequired: true,
      },
    }),
    prisma.pinResetRequest.update({
      where: { id: request.id },
      data: {
        status: "approved",
        resolvedAt: new Date(),
        resolvedBy: auth.payload.sub,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    pin: plainPin,
    userId: request.userId,
    mobile: request.user.mobile ?? request.mobile,
  });
}
export const dynamic = "force-dynamic";
