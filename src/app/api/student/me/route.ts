import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRolesApi(req, ["student"]);
  if (!auth.ok) return auth.response;

  const student = await prisma.studentAccount.findUnique({
    where: {
      id: auth.payload.sub,
    },
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
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json({ student });
}
