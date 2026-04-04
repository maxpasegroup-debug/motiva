import { NextRequest, NextResponse } from "next/server";
import { parseTeacherIdFromRequest } from "@/server/auth/teacher-bearer";
import {
  getAttendanceForDay,
  getOrCreateBatchProgress,
} from "@/server/attendance/attendance-db";
import { getBatchStudentIds, verifyTeacherOwnsBatch } from "@/server/batches/batches-db";
import { getCourseById, listLessonsForCourse } from "@/server/courses/courses-db";
import { getCourseProgress } from "@/server/progress/course-progress-db";
import { findAuthUserById } from "@/server/auth/auth-users-store";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  void req;
  const teacherId = parseTeacherIdFromRequest(req);
  if (!teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const id = params.id;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const batch = await verifyTeacherOwnsBatch(id, teacherId);
    if (!batch) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const course = await getCourseById(batch.course_id);
    const bp = await getOrCreateBatchProgress(id);
    const attMap = await getAttendanceForDay(id, bp.current_day);
    const attendance_for_day: Record<string, "present" | "absent"> = {};
    attMap.forEach((v, k) => {
      attendance_for_day[k] = v;
    });
    const studentIds = await getBatchStudentIds(id);
    const lessons = await listLessonsForCourse(batch.course_id);

    const students = await Promise.all(
      studentIds.map(async (student_id) => {
        const u = await findAuthUserById(student_id);
        const progress = await getCourseProgress(student_id, batch.course_id);
        return {
          id: student_id,
          name: u?.name ?? "—",
          email: u?.email ?? "",
          progress: progress
            ? {
                lesson_id: progress.lesson_id,
                furthest_completed_order: progress.furthest_completed_order,
                last_watched_at: progress.last_watched_at.toISOString(),
              }
            : null,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      batch,
      current_day: bp.current_day,
      attendance_for_day,
      course: course
        ? {
            id: course.id,
            title: course.title,
            description: course.description,
            thumbnail_path: course.thumbnail_path,
            is_published: course.is_published,
          }
        : null,
      lessons: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        order: l.sort_order,
      })),
      students,
    });
  } catch (e) {
    console.error("[GET /api/teacher/batches/[id]]", e);
    return NextResponse.json(
      { error: "Could not load batch" },
      { status: 500 },
    );
  }
}
