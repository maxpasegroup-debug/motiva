import { NextRequest, NextResponse } from "next/server";
import { parseTeacherIdFromRequest } from "@/server/auth/teacher-bearer";
import { listBatchesForTeacher } from "@/server/batches/batches-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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

  try {
    const batches = await listBatchesForTeacher(teacherId);
    return NextResponse.json({ success: true, batches });
  } catch (e) {
    console.error("[GET /api/teacher/batches]", e);
    return NextResponse.json(
      { error: "Could not list batches" },
      { status: 500 },
    );
  }
}
