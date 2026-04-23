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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = getUserId(req);
  if (!userId) {
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

  const progressRaw = (body as Record<string, unknown>).progress;
  if (typeof progressRaw !== "number" || Number.isNaN(progressRaw)) {
    return NextResponse.json(
      { error: "progress must be a number" },
      { status: 400 },
    );
  }

  const progress = Math.max(0, Math.min(100, Math.round(progressRaw)));

  const existing = await prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId: params.id,
      },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not enrolled" }, { status: 403 });
  }

  await prisma.courseEnrollment.update({
    where: { userId_courseId: { userId, courseId: params.id } },
    data: { progress },
  });

  return NextResponse.json({ progress });
}
export const dynamic = "force-dynamic";
