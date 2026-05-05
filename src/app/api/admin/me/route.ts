import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSessionToken } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";

export async function GET(req: NextRequest) {
  const token = getAdminSessionToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = verifyJwt(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = await prisma.user.findFirst({
    where: { id: payload.userId, role: "admin", isActive: true },
    select: { id: true, name: true, mobile: true, role: true },
  });

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ admin });
}

export const dynamic = "force-dynamic";
