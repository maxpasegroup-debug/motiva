import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/server/auth/require-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ enquiries });
}
