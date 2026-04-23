import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRolesApi(req, ["parent"]);
  if (!auth.ok) return auth.response;

  const parent = await prisma.parentAccount.findUnique({
    where: {
      id: auth.payload.sub,
    },
    include: {
      student: {
        include: {
          batch: {
            include: {
              progress: true,
            },
          },
          learningPlans: {
            orderBy: {
              updatedAt: "desc",
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!parent) {
    return NextResponse.json({ error: "Parent not found" }, { status: 404 });
  }

  return NextResponse.json({ parent });
}
