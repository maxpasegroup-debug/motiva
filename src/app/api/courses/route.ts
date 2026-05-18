import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { courseIsVisibleToAudience } from "@/lib/recorded-courses";
import type { CourseAudienceRole } from "@/lib/recorded-courses";
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

function roleToCourseAudience(role: string): CourseAudienceRole | "all" {
  if (
    role === "student" ||
    role === "parent" ||
    role === "teacher" ||
    role === "mentor" ||
    role === "public"
  ) {
    return role;
  }
  return "all";
}

export async function GET(req: NextRequest) {
  const payload = getAuthPayload(req);

  let roles: string[] = ["public"];
  if (payload && isRole(payload.role)) {
    roles = Array.from(new Set(["public", "all", payload.role]));
  }

  const courses = (await prisma.course.findMany({
    where: {
      status: "published",
    },
    orderBy: { createdAt: "desc" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { videos: { orderBy: { order: "asc" } } },
      },
    },
  })).filter((course) =>
    roles.some((role) =>
      courseIsVisibleToAudience(
        course.targetRole,
        roleToCourseAudience(role),
      ),
    ),
  );

  return NextResponse.json({ courses });
}
export const dynamic = "force-dynamic";
