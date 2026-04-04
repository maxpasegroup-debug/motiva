import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/require-admin";
import { findAuthUserById } from "@/server/auth/auth-users-store";
import {
  getAttendanceSummaryByStudent,
  getOrCreateBatchProgress,
  listAttendanceByDay,
} from "@/server/attendance/attendance-db";
import { getBatchById, getBatchStudentIds } from "@/server/batches/batches-db";
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
    const bp = await getOrCreateBatchProgress(id);
    const byDay = await listAttendanceByDay(id, batch.duration);
    const summaries = await getAttendanceSummaryByStudent(id, batch.duration);
    const sumMap = new Map(summaries.map((s) => [s.student_id, s] as const));
    const roster = await getBatchStudentIds(id);
    const students = await Promise.all(
      roster.map(async (student_id) => {
        const u = await findAuthUserById(student_id);
        const s = sumMap.get(student_id);
        const present = s?.present ?? 0;
        const absent = s?.absent ?? 0;
        return {
          student_id,
          name: u?.name ?? "—",
          present,
          absent,
          attended_label: `${present} / ${batch.duration}`,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      batch: { id: batch.id, name: batch.name, duration: batch.duration },
      current_day: bp.current_day,
      by_day: byDay,
      students,
    });
  } catch (e) {
    console.error("[GET attendance-report]", e);
    return NextResponse.json(
      { error: "Could not load report" },
      { status: 500 },
    );
  }
}
