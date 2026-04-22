import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/require-admin";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const requests = await prisma.pinResetRequest.findMany({
    where: { status: "pending" },
    orderBy: { requestedAt: "desc" },
    select: {
      id: true,
      mobile: true,
      requestedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          mobile: true,
        },
      },
    },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      userId: r.user.id,
      name: r.user.name,
      mobile: r.user.mobile ?? r.mobile,
      requestedAt: r.requestedAt,
    })),
  });
}
