import { NextRequest, NextResponse } from "next/server";
import { parseStudentIdFromRequest } from "@/server/auth/student-bearer";
import {
  getOrCreateBatchProgress,
  getStudentDayStatuses,
} from "@/server/attendance/attendance-db";
import { getBatchById } from "@/server/batches/batches-db";
import { getDatabaseUrl, getPool } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const id = params.id;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const pool = getPool();
    const m = await pool.query<{ batch_id: string }>(
      `SELECT batch_id FROM batch_students WHERE student_id = $1 AND batch_id = $2`,
      [studentId, id],
    );
    if (!m.rows[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const batch = await getBatchById(id);
    if (!batch) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const bp = await getOrCreateBatchProgress(id);
    const statusRows = await getStudentDayStatuses(
      studentId,
      id,
      batch.duration,
    );
    const statusByDay = new Map(
      statusRows.map((r) => [r.day_number, r.status] as const),
    );
    const days = Array.from({ length: batch.duration }, (_, i) => {
      const dayNum = i + 1;
      return {
        day_number: dayNum,
        unlocked: dayNum <= bp.current_day,
        past: dayNum < bp.current_day,
        attendance: statusByDay.get(dayNum) ?? null,
      };
    });
    return NextResponse.json({
      success: true,
      batch,
      current_day: bp.current_day,
      days,
    });
  } catch (e) {
    console.error("[GET /api/student/batches/[id]]", e);
    return NextResponse.json(
      { error: "Could not load batch" },
      { status: 500 },
    );
  }
}
