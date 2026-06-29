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
  const current = await prisma.user.findUnique({
    where: { id },
    select: { profileData: true },
  });
  const profile =
    current?.profileData &&
    typeof current.profileData === "object" &&
    !Array.isArray(current.profileData)
      ? (current.profileData as Record<string, unknown>)
      : {};
  await prisma.user.update({
    where: { id },
    data: {
      pin: pinHash,
      passwordHash: null,
      pinResetRequired: true,
      profileData: { ...profile, visiblePin: pin },
    },
  });

  return NextResponse.json({ success: true, pin });
}

export const dynamic = "force-dynamic";
