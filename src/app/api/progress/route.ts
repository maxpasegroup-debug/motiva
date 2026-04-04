import { NextRequest, NextResponse } from "next/server";
import { parseStudentIdFromRequest } from "@/server/auth/student-bearer";
import {
  getStudentBatchRow,
  studentHasCourseAccess,
} from "@/server/batches/batches-db";
import {
  getCourseById,
  listLessonsForCourse,
} from "@/server/courses/courses-db";
import {
  getCourseProgress,
  getLessonOrderInCourse,
  upsertCourseProgress,
} from "@/server/progress/course-progress-db";
import { getOrCreateBatchProgress } from "@/server/attendance/attendance-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

export async function GET(req: NextRequest) {
  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const studentId = parseStudentIdFromRequest(req);
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courseId = req.nextUrl.searchParams.get("course_id");

  try {
    if (courseId) {
      if (!isUuid(courseId)) {
        return NextResponse.json({ error: "Invalid course_id" }, { status: 400 });
      }
      const course = await getCourseById(courseId);
      if (!course || !course.is_published) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const allowed = await studentHasCourseAccess(studentId, courseId);
      if (!allowed) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const lessons = await listLessonsForCourse(courseId);
      const total_lessons = lessons.length;
      const progress = await getCourseProgress(studentId, courseId);
      const furthest = progress?.furthest_completed_order ?? -1;
      const completed_lessons = Math.min(
        total_lessons,
        Math.max(0, furthest + 1),
      );

      let lesson_id: string | null = progress?.lesson_id ?? null;
      let current_lesson_number = 0;
      if (lesson_id) {
        const idx = lessons.findIndex((l) => l.id === lesson_id);
        if (idx >= 0) current_lesson_number = idx + 1;
        else lesson_id = null;
      }

      const batchRow = await getStudentBatchRow(studentId);
      let batch_current_day: number | null = null;
      if (batchRow?.course_id === courseId) {
        const bp = await getOrCreateBatchProgress(batchRow.id);
        batch_current_day = bp.current_day;
      }

      return NextResponse.json({
        success: true,
        course_id: courseId,
        lesson_id,
        furthest_completed_order: furthest,
        total_lessons,
        completed_lessons,
        current_lesson_number,
        batch_current_day,
        last_watched_at: progress?.last_watched_at
          ? new Date(progress.last_watched_at).toISOString()
          : null,
      });
    }

    const batchRow = await getStudentBatchRow(studentId);
    if (!batchRow) {
      return NextResponse.json({ success: true, courses: [] });
    }
    const bp = await getOrCreateBatchProgress(batchRow.id);
    const cid = batchRow.course_id;
    const course = await getCourseById(cid);
    if (!course?.is_published) {
      return NextResponse.json({ success: true, courses: [] });
    }
    const lessons = await listLessonsForCourse(cid);
    const total = lessons.length;
    const progress = await getCourseProgress(studentId, cid);
    const furthest = progress?.furthest_completed_order ?? -1;
    const completed_lessons = Math.min(total, Math.max(0, furthest + 1));
    let lesson_id: string | null = progress?.lesson_id ?? null;
    let current_lesson_number = 0;
    if (lesson_id) {
      const idx = lessons.findIndex((l) => l.id === lesson_id);
      if (idx >= 0) current_lesson_number = idx + 1;
      else lesson_id = null;
    }
    const enriched = [
      {
        course_id: cid,
        title: course.title,
        thumbnail_path: course.thumbnail_path,
        total_lessons: total,
        lesson_id,
        furthest_completed_order: furthest,
        completed_lessons,
        current_lesson_number,
        batch_current_day: bp.current_day,
        last_watched_at: progress?.last_watched_at
          ? new Date(progress.last_watched_at).toISOString()
          : null,
      },
    ];

    return NextResponse.json({ success: true, courses: enriched });
  } catch (e) {
    console.error("[GET /api/progress]", e);
    return NextResponse.json(
      { error: "Could not load progress" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const studentId = parseStudentIdFromRequest(req);
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const course_id = typeof o.course_id === "string" ? o.course_id : "";
  const lesson_id = typeof o.lesson_id === "string" ? o.lesson_id : "";
  const completed = o.completed === true;

  if (!isUuid(course_id) || !isUuid(lesson_id)) {
    return NextResponse.json(
      { error: "course_id and lesson_id must be UUIDs" },
      { status: 400 },
    );
  }

  try {
    const course = await getCourseById(course_id);
    if (!course || !course.is_published) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const allowed = await studentHasCourseAccess(studentId, course_id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const batchRow = await getStudentBatchRow(studentId);
    if (!batchRow || batchRow.course_id !== course_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const bp = await getOrCreateBatchProgress(batchRow.id);
    const lessonOrder = await getLessonOrderInCourse(course_id, lesson_id);
    if (lessonOrder === null) {
      return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });
    }
    if (lessonOrder + 1 > bp.current_day) {
      return NextResponse.json(
        { error: "Lesson locked until your batch reaches this day" },
        { status: 403 },
      );
    }

    await upsertCourseProgress({
      studentId,
      courseId: course_id,
      lessonId: lesson_id,
      markComplete: completed,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "Lesson not in course") {
      return NextResponse.json({ error: "Invalid lesson" }, { status: 400 });
    }
    console.error("[POST /api/progress]", e);
    return NextResponse.json(
      { error: "Could not save progress" },
      { status: 500 },
    );
  }
}
