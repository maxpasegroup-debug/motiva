import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionToken } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";
import { listCoursesWithLessonCounts } from "@/server/courses/courses-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public: published courses only.
 * With valid admin Bearer/cookie: all courses (including unpublished).
 */
export async function GET(req: NextRequest) {
  if (!getDatabaseUrl()) {
    return NextResponse.json({ courses: [] });
  }

  let publishedOnly = true;
  const token = getAdminSessionToken(req);
  if (token) {
    try {
      const payload = verifyJwt(token);
      if (payload.role === "admin") {
        publishedOnly = false;
      }
    } catch {
      /* treat as public */
    }
  }

  try {
    const rows = await listCoursesWithLessonCounts({ publishedOnly });
    return NextResponse.json({
      courses: rows.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnail_path: c.thumbnail_path,
        lesson_count: c.lesson_count,
        ...(publishedOnly ? {} : { is_published: c.is_published }),
      })),
    });
  } catch (e) {
    console.error("[GET /api/courses]", e);
    return NextResponse.json(
      { error: "Could not load courses" },
      { status: 500 },
    );
  }
}
