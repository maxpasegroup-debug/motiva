import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRolesApi(req, ["student"]);
  if (!auth.ok) return auth.response;

  const student = await prisma.studentAccount.findUnique({
    where: { userId: auth.payload.sub },
    select: { id: true },
  });

  if (!student) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  const records = await prisma.attendance.findMany({
    where: { studentId: student.id },
    orderBy: [{ createdAt: "desc" }, { dayNumber: "desc" }],
  });

  return NextResponse.json({ records });
}
