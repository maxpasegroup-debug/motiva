import { NextRequest, NextResponse } from "next/server";
import { parseTeacherIdFromRequest } from "@/server/auth/teacher-bearer";
import {
  teacherMarkDayComplete,
  teacherUnlockNextDay,
} from "@/server/batches/batches-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const action =
    body && typeof body === "object" && typeof (body as { action?: string }).action === "string"
      ? (body as { action: string }).action
      : "";

  try {
    if (action === "mark_complete") {
      const batch = await teacherMarkDayComplete(id, teacherId);
      if (!batch) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, batch });
    }
    if (action === "unlock_next") {
      const batch = await teacherUnlockNextDay(id, teacherId);
      if (!batch) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, batch });
    }
    return NextResponse.json(
      { error: "action must be mark_complete or unlock_next" },
      { status: 400 },
    );
  } catch (e) {
    console.error("[POST /api/teacher/batches/[id]/day]", e);
    return NextResponse.json(
      { error: "Could not update batch" },
      { status: 500 },
    );
  }
}
