import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRolesApi(req, ["student"]);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.payload.sub },
    select: { id: true, name: true, mobile: true, role: true, isActive: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Student user not found" }, { status: 404 });
  }

  const student = await prisma.studentAccount.findUnique({
    where: { userId: user.id },
    include: {
      batch: {
        include: {
          progress: true,
        },
      },
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  return NextResponse.json({ user, student });
}
