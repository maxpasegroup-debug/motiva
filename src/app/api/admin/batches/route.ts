import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/require-admin";
import {
  countPresentOnDay,
  getOrCreateBatchProgress,
} from "@/server/attendance/attendance-db";
import { insertBatch, listBatchesAdmin } from "@/server/batches/batches-db";
import { getCourseById } from "@/server/courses/courses-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  void req;
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  try {
    const batches = await listBatchesAdmin();
    const enriched = await Promise.all(
      batches.map(async (b) => {
        const bp = await getOrCreateBatchProgress(b.id);
        const present_today = await countPresentOnDay(b.id, bp.current_day);
        return {
          ...b,
          current_day: bp.current_day,
          present_today,
        };
      }),
    );
    return NextResponse.json({ success: true, batches: enriched });
  } catch (e) {
    console.error("[GET /api/admin/batches]", e);
    return NextResponse.json(
      { error: "Could not list batches" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
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
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const course_id = typeof o.course_id === "string" ? o.course_id : "";
  const teacher_id = typeof o.teacher_id === "string" ? o.teacher_id : "";
  const durationRaw = o.duration;
  const duration = durationRaw === 25 ? 25 : 12;
  const start_date =
    o.start_date === null || o.start_date === undefined
      ? null
      : typeof o.start_date === "string"
        ? o.start_date
        : null;

  if (!name || !UUID_RE.test(course_id) || !teacher_id) {
    return NextResponse.json(
      { error: "name, course_id (UUID), and teacher_id are required" },
      { status: 400 },
    );
  }

  try {
    const course = await getCourseById(course_id);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    const { id } = await insertBatch({
      name,
      course_id,
      teacher_id,
      duration,
      start_date,
    });
    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error("[POST /api/admin/batches]", e);
    return NextResponse.json(
      { error: "Could not create batch" },
      { status: 500 },
    );
  }
}
