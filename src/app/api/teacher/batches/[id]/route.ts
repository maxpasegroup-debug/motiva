import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseTeacherIdFromRequest } from "@/server/auth/teacher-bearer";
import {
  getAttendanceForDay,
  getOrCreateBatchProgress,
} from "@/server/attendance/attendance-db";
import { getBatchStudentIds, verifyTeacherOwnsBatch } from "@/server/batches/batches-db";
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

  try {
    const batch = await verifyTeacherOwnsBatch(id, teacherId);
    if (!batch) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const bp = await getOrCreateBatchProgress(id);
    const attMap = await getAttendanceForDay(id, bp.current_day);
    const attendance_for_day: Record<string, "present" | "absent"> = {};
    attMap.forEach((v, k) => {
      attendance_for_day[k] = v;
    });
    const studentIds = await getBatchStudentIds(id);
    const studentUsers = await prisma.user.findMany({
      where: { id: { in: studentIds }, role: "student" },
      select: { id: true, name: true, mobile: true },
    });
    const studentMap = new Map(studentUsers.map((user) => [user.id, user]));

    const students = studentIds.map((student_id) => {
      const user = studentMap.get(student_id);
      return {
        id: student_id,
        name: user?.name ?? "-",
        mobile: user?.mobile ?? "",
        phone: user?.mobile ?? "",
      };
    });

    return NextResponse.json({
      success: true,
      batch,
      current_day: bp.current_day,
      attendance_for_day,
      students,
    });
  } catch (e) {
    console.error("[GET /api/teacher/batches/[id]]", e);
    return NextResponse.json(
      { error: "Could not load batch" },
      { status: 500 },
    );
  }
}
