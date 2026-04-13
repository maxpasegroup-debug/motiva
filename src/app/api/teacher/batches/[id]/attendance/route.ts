import { NextRequest, NextResponse } from "next/server";
import { parseTeacherIdFromRequest } from "@/server/auth/teacher-bearer";
import {
  getBatchStudentIds,
  verifyTeacherOwnsBatch,
} from "@/server/batches/batches-db";
import {
  getOrCreateBatchProgress,
  replaceAttendanceForDay,
} from "@/server/attendance/attendance-db";
import { getDatabaseUrl } from "@/server/db/pool";
import {
  createParentNotification,
  listParentIdsForStudentIds,
} from "@/server/parents/parents-portal-db";

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

  const batchId = params.id;
  if (!UUID_RE.test(batchId)) {
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
  const entriesRaw = o.entries;
  if (!Array.isArray(entriesRaw)) {
    return NextResponse.json(
      { error: "entries must be an array" },
      { status: 400 },
    );
  }

  try {
    const batch = await verifyTeacherOwnsBatch(batchId, teacherId);
    if (!batch) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const bp = await getOrCreateBatchProgress(batchId);
    const dayNumber =
      typeof o.day_number === "number" &&
      Number.isInteger(o.day_number) &&
      o.day_number >= 1
        ? o.day_number
        : bp.current_day;
    if (dayNumber > batch.duration) {
      return NextResponse.json({ error: "Invalid day_number" }, { status: 400 });
    }

    const roster = new Set(await getBatchStudentIds(batchId));
    const entries: { student_id: string; status: "present" | "absent" }[] =
      [];
    for (const item of entriesRaw) {
      if (!item || typeof item !== "object") continue;
      const e = item as Record<string, unknown>;
      const sid = typeof e.student_id === "string" ? e.student_id : "";
      const st = e.status === "absent" ? "absent" : "present";
      if (!sid || !roster.has(sid)) {
        return NextResponse.json(
          { error: "Invalid student in roster" },
          { status: 400 },
        );
      }
      entries.push({ student_id: sid, status: st });
    }

    await replaceAttendanceForDay({
      batchId,
      dayNumber,
      markedBy: teacherId,
      entries,
    });

    if (getDatabaseUrl() && entries.length > 0) {
      try {
        const parentByStudent = await listParentIdsForStudentIds(
          entries.map((e) => e.student_id),
        );
        for (const e of entries) {
          const parentId = parentByStudent.get(e.student_id);
          if (!parentId) continue;
          const msg =
            e.status === "present"
              ? `Day ${dayNumber} marked present for your child.`
              : `Your child was absent on day ${dayNumber}.`;
          await createParentNotification(parentId, msg);
        }
      } catch (notifyErr) {
        console.error("[POST attendance] parent notify", notifyErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[POST attendance]", e);
    return NextResponse.json(
      { error: "Could not save attendance" },
      { status: 500 },
    );
  }
}
