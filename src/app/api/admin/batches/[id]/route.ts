import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/require-admin";
import {
  deleteBatchById,
  getBatchById,
  getBatchStudentIds,
  updateBatch,
} from "@/server/batches/batches-db";
import { getCourseById } from "@/server/courses/courses-db";
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
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

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
    const batch = await getBatchById(id);
    if (!batch) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const course = await getCourseById(batch.course_id);
    const student_ids = await getBatchStudentIds(id);
    return NextResponse.json({
      success: true,
      batch,
      course: course
        ? {
            id: course.id,
            title: course.title,
            thumbnail_path: course.thumbnail_path,
            is_published: course.is_published,
          }
        : null,
      student_ids,
    });
  } catch (e) {
    console.error("[GET /api/admin/batches/[id]]", e);
    return NextResponse.json(
      { error: "Could not load batch" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

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
  const patch: {
    name?: string;
    course_id?: string;
    teacher_id?: string;
    duration?: 12 | 25;
    start_date?: string | null;
  } = {};
  if (typeof o.name === "string") patch.name = o.name;
  if (typeof o.course_id === "string" && UUID_RE.test(o.course_id)) {
    patch.course_id = o.course_id;
  }
  if (typeof o.teacher_id === "string") patch.teacher_id = o.teacher_id;
  if (o.duration === 12 || o.duration === 25) patch.duration = o.duration;
  if (o.start_date === null || typeof o.start_date === "string") {
    patch.start_date = o.start_date as string | null;
  }

  try {
    const existing = await getBatchById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (patch.course_id) {
      const c = await getCourseById(patch.course_id);
      if (!c) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 });
      }
    }
    await updateBatch(id, patch);
    const batch = await getBatchById(id);
    return NextResponse.json({ success: true, batch });
  } catch (e) {
    console.error("[PATCH /api/admin/batches/[id]]", e);
    return NextResponse.json(
      { error: "Could not update batch" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  void req;
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

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
    const ok = await deleteBatchById(id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/admin/batches/[id]]", e);
    return NextResponse.json(
      { error: "Could not delete batch" },
      { status: 500 },
    );
  }
}
