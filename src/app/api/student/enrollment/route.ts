import { NextRequest, NextResponse } from "next/server";
import { parseStudentIdFromRequest } from "@/server/auth/student-bearer";
import { getOrCreateBatchProgress } from "@/server/attendance/attendance-db";
import { getStudentBatchRow } from "@/server/batches/batches-db";
import { getCourseById, listLessonsForCourse } from "@/server/courses/courses-db";
import { getCourseProgress } from "@/server/progress/course-progress-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  void req;
  const studentId = parseStudentIdFromRequest(req);
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  try {
    const row = await getStudentBatchRow(studentId);
    if (!row) {
      return NextResponse.json({
        success: true,
        enrolled: false,
        batch: null,
        course: null,
        progress: null,
      });
    }

    const bp = await getOrCreateBatchProgress(row.id);
    const course = await getCourseById(row.course_id);
    const lessons = course ? await listLessonsForCourse(row.course_id) : [];
    const total_lessons = lessons.length;
    const progressRow = await getCourseProgress(studentId, row.course_id);
    const furthest = progressRow?.furthest_completed_order ?? -1;
    const completed_lessons = Math.min(
      total_lessons,
      Math.max(0, furthest + 1),
    );
    let current_lesson_number = 0;
    if (progressRow?.lesson_id) {
      const idx = lessons.findIndex((l) => l.id === progressRow.lesson_id);
      if (idx >= 0) current_lesson_number = idx + 1;
    }

    return NextResponse.json({
      success: true,
      enrolled: true,
      batch: {
        id: row.id,
        name: row.name,
        course_id: row.course_id,
        teacher_id: row.teacher_id,
        duration: row.duration,
        start_date: row.start_date
          ? new Date(row.start_date).toISOString().slice(0, 10)
          : null,
        unlocked_day: row.unlocked_day,
        completed_days: row.completed_days,
        current_day: bp.current_day,
      },
      course: course
        ? {
            id: course.id,
            title: course.title,
            thumbnail_path: course.thumbnail_path,
            is_published: course.is_published,
            total_lessons,
          }
        : null,
      progress: {
        lesson_id: progressRow?.lesson_id ?? null,
        furthest_completed_order: furthest,
        completed_lessons,
        current_lesson_number,
        last_watched_at: progressRow?.last_watched_at
          ? new Date(progressRow.last_watched_at).toISOString()
          : null,
      },
    });
  } catch (e) {
    console.error("[GET /api/student/enrollment]", e);
    return NextResponse.json(
      { error: "Could not load enrollment" },
      { status: 500 },
    );
  }
}
