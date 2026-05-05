import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/server/auth/require-admin";
import { hashPin } from "@/server/auth/unified-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const pin = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  const pinHash = await hashPin(pin);
  await prisma.user.update({
    where: { id },
    data: {
      pin: pinHash,
      passwordHash: null,
      pinResetRequired: true,
    },
  });

  return NextResponse.json({ success: true, pin });
}

export const dynamic = "force-dynamic";
