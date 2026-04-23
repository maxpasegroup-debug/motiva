import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getBearerToken } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";

const ADMIN_AUTH_COOKIE = "motiva_admin_auth";
const USER_AUTH_COOKIE = "motiva_user_auth";

function getUserId(req: NextRequest): string | null {
  const token =
    getBearerToken(req) ??
    req.cookies.get(USER_AUTH_COOKIE)?.value ??
    req.cookies.get(ADMIN_AUTH_COOKIE)?.value ??
    null;
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
