import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseParentIdFromRequest } from "@/server/auth/parent-bearer";
import {
  getOrCreateBatchProgress,
  getStudentDayStatuses,
} from "@/server/attendance/attendance-db";
import { getStudentBatchRow } from "@/server/batches/batches-db";
import { getDatabaseUrl } from "@/server/db/pool";
import {
  countUnreadParentNotifications,
  getParentById,
  getStudentPaymentStatusDb,
  listParentNotifications,
} from "@/server/parents/parents-portal-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  void req;
  const parentId = parseParentIdFromRequest(req);
  if (!parentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  try {
    const row = await getParentById(parentId);
    if (!row) {
      return NextResponse.json({
        success: true,
        linked: false,
        message: "Parent profile not linked yet. Ask your academy admin.",
      });
    }

    const studentUser = await prisma.user.findUnique({
      where: { id: row.student_id },
      select: { name: true },
    });
    const studentName = studentUser?.name ?? "Student";

    const batch = await getStudentBatchRow(row.student_id);
    if (!batch) {
      const notifications = await listParentNotifications(parentId, 15);
      const unread = await countUnreadParentNotifications(parentId);
      return NextResponse.json({
        success: true,
        linked: true,
        enrolled: false,
        parent: { name: row.name, phone: row.phone },
        student: { id: row.student_id, name: studentName },
        batch: null,
        course: null,
        progress_label: null,
        days: [],
        payment: { status: "pending" as const },
        notifications,
        unread_count: unread,
      });
    }

    const bp = await getOrCreateBatchProgress(batch.id);
    const attRows = await getStudentDayStatuses(
      row.student_id,
      batch.id,
      batch.duration,
    );
    const attMap = new Map(attRows.map((r) => [r.day_number, r.status]));
    const days = Array.from({ length: batch.duration }, (_, i) => {
      const day_number = i + 1;
      const st = attMap.get(day_number);
      return {
        day_number,
        attendance:
          st === "present" ? ("present" as const) : st === "absent" ? ("absent" as const) : null,
      };
    });

    const payment = await getStudentPaymentStatusDb(row.student_id);
    const notifications = await listParentNotifications(parentId, 15);
    const unread = await countUnreadParentNotifications(parentId);

    return NextResponse.json({
      success: true,
      linked: true,
      enrolled: true,
      parent: { name: row.name, phone: row.phone },
      student: { id: row.student_id, name: studentName },
      batch: {
        id: batch.id,
        name: batch.name,
        duration: batch.duration,
        current_day: bp.current_day,
      },
      course: { title: batch.name },
      progress_label: `Day ${bp.current_day} of ${batch.duration}`,
      days,
      payment: { status: payment },
      notifications: notifications.map((n) => ({
        id: n.id,
        message: n.message,
        created_at: new Date(n.created_at).toISOString(),
        is_read: n.is_read,
      })),
      unread_count: unread,
    });
  } catch (e) {
    console.error("[GET /api/parent/dashboard]", e);
    return NextResponse.json(
      { error: "Could not load dashboard" },
      { status: 500 },
    );
  }
}
