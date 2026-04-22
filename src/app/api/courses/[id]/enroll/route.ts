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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, status: true },
  });
  if (!course || course.status !== "published") {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const existing = await prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: params.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ enrolled: true }, { status: 200 });
  }

  await prisma.courseEnrollment.create({
    data: {
      userId,
      courseId: params.id,
      progress: 0,
    },
  });

  return NextResponse.json({ enrolled: true });
}
