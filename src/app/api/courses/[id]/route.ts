import { NextRequest, NextResponse } from "next/server";
import { parseStudentIdFromRequest } from "@/server/auth/student-bearer";
import { getAdminSessionToken } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";
import { studentHasCourseAccess } from "@/server/batches/batches-db";
import {
  getCourseById,
  listLessonsForCourse,
} from "@/server/courses/courses-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public: published course only.
 * Admin Bearer/cookie: may load unpublished (for preview).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  let allowUnpublished = false;
  const token = getAdminSessionToken(req);
  if (token) {
    try {
      const payload = verifyJwt(token);
      if (payload.role === "admin") {
        allowUnpublished = true;
      }
    } catch {
      /* public */
    }
  }

  try {
    const course = await getCourseById(params.id);
    if (!course) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!course.is_published && !allowUnpublished) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const studentId = parseStudentIdFromRequest(req);
    if (studentId && course.is_published) {
      const allowed = await studentHasCourseAccess(studentId, params.id);
      if (!allowed) {
        return NextResponse.json(
          { error: "No access to this course" },
          { status: 403 },
        );
      }
    }

    const lessonRows = await listLessonsForCourse(params.id);
    return NextResponse.json({
      title: course.title,
      description: course.description,
      thumbnail_path: course.thumbnail_path,
      lessons: lessonRows.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        video_url: l.video_url,
        order: l.sort_order,
      })),
    });
  } catch (e) {
    console.error("[GET /api/courses/[id]]", e);
    return NextResponse.json(
      { error: "Could not load course" },
      { status: 500 },
    );
  }
}
