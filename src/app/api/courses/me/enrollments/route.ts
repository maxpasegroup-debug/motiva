import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionToken } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";

function getUserId(req: NextRequest): string | null {
  const token = getSessionToken(req);
  if (!token) return null;
  try {
    return verifyJwt(token).sub;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.courseEnrollment.findMany({
    where: { userId },
    select: { courseId: true, progress: true },
  });

  return NextResponse.json({ enrollments: rows });
}
export const dynamic = "force-dynamic";
