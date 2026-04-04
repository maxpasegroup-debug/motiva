import { NextRequest, NextResponse } from "next/server";
import { parseTeacherIdFromRequest } from "@/server/auth/teacher-bearer";
import { verifyTeacherOwnsBatch } from "@/server/batches/batches-db";
import {
  getOrCreateBatchProgress,
  incrementBatchCurrentDay,
} from "@/server/attendance/attendance-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
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

  const batchId = params.id;
  if (!UUID_RE.test(batchId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const batch = await verifyTeacherOwnsBatch(batchId, teacherId);
    if (!batch) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await getOrCreateBatchProgress(batchId);
    const prev = await getOrCreateBatchProgress(batchId);
    const row = await incrementBatchCurrentDay(batchId, batch.duration);
    if (!row) {
      return NextResponse.json({ error: "Could not advance" }, { status: 500 });
    }
    const advanced = row.current_day > prev.current_day;
    return NextResponse.json({
      success: true,
      current_day: row.current_day,
      previous_day: prev.current_day,
      day_completed_message: advanced
        ? `Day ${prev.current_day} completed`
        : null,
      at_end: row.current_day >= batch.duration && !advanced,
    });
  } catch (e) {
    console.error("[POST next-day]", e);
    return NextResponse.json(
      { error: "Could not advance day" },
      { status: 500 },
    );
  }
}
