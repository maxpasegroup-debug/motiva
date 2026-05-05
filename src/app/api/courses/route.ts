import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isRole } from "@/lib/roles";
import { getSessionToken } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";

function getAuthPayload(req: NextRequest) {
  const token = getSessionToken(req);
  if (!token) return null;
  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const payload = getAuthPayload(req);

  let roles: string[] = ["public"];
  if (payload && isRole(payload.role)) {
    roles = Array.from(new Set(["public", "all", payload.role]));
  }

  const courses = await prisma.course.findMany({
    where: {
      status: "published",
      targetRole: { in: roles },
    },
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { videos: { orderBy: { order: "asc" } } },
      },
    },
  });

  return NextResponse.json({ courses });
}
export const dynamic = "force-dynamic";
