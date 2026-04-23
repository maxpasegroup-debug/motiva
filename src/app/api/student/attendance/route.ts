import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRolesApi(req, ["student"]);
  if (!auth.ok) return auth.response;

  const limitValue = Number(req.nextUrl.searchParams.get("limit") ?? "0");
  const take = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(limitValue, 90) : undefined;

  const records = await prisma.attendance.findMany({
    where: {
      studentId: auth.payload.sub,
    },
    orderBy: {
      createdAt: "desc",
    },
    ...(take ? { take } : {}),
  });

  return NextResponse.json({ records });
}
