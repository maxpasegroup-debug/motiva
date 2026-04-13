import { NextRequest, NextResponse } from "next/server";
import { parseStudentIdFromRequest } from "@/server/auth/student-bearer";
import { getOrCreateBatchProgress } from "@/server/attendance/attendance-db";
import { getStudentBatchRow } from "@/server/batches/batches-db";
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
      });
    }

    const bp = await getOrCreateBatchProgress(row.id);

    return NextResponse.json({
      success: true,
      enrolled: true,
      batch: {
        id: row.id,
        name: row.name,
        teacher_id: row.teacher_id,
        duration: row.duration,
        start_date: row.start_date
          ? new Date(row.start_date).toISOString().slice(0, 10)
          : null,
        unlocked_day: row.unlocked_day,
        completed_days: row.completed_days,
        current_day: bp.current_day,
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
