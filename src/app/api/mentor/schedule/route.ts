import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfWeek, addDays } from "@/lib/mentor";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function validDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

export async function GET(req: NextRequest) {
  const auth = await requireRolesApi(req, ["mentor", "admin"]);
  if (!auth.ok) return auth.response;

  const weekParam = req.nextUrl.searchParams.get("week");
  const baseDate = weekParam && validDate(weekParam) ? new Date(weekParam) : new Date();
  const weekStart = startOfWeek(baseDate);
  const weekEnd = addDays(weekStart, 6);

  const schedules = await prisma.classSchedule.findMany({
    where: {
      mentorId: auth.payload.sub,
      scheduledDate: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    orderBy: [{ scheduledDate: "asc" }, { scheduledTime: "asc" }],
  });

  return NextResponse.json({ schedules, weekStart, weekEnd });
}

export async function POST(req: NextRequest) {
  const auth = await requireRolesApi(req, ["mentor", "admin"]);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const studentId = typeof payload.studentId === "string" ? payload.studentId.trim() : "";
  const teacherId = typeof payload.teacherId === "string" ? payload.teacherId.trim() : "";
  const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
  const classType =
    typeof payload.classType === "string" ? payload.classType.trim() : "one-to-one";
  const scheduledDate = payload.scheduledDate;
  const scheduledTime =
    typeof payload.scheduledTime === "string" ? payload.scheduledTime.trim() : "";
  const durationMinutes =
    typeof payload.durationMinutes === "number"
      ? payload.durationMinutes
      : typeof payload.durationMinutes === "string"
        ? Number(payload.durationMinutes)
        : 60;
  const notes = typeof payload.notes === "string" ? payload.notes.trim() : "";

  if (!studentId || !teacherId || !subject || !validDate(scheduledDate) || !scheduledTime) {
    return NextResponse.json(
      { error: "Student, teacher, subject, date, and time are required" },
      { status: 400 },
    );
  }

  const student = await prisma.studentAccount.findFirst({
    where: {
      id: studentId,
      mentorId: auth.payload.sub,
    },
    select: {
      id: true,
      batchId: true,
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const schedule = await prisma.classSchedule.create({
    data: {
      batchId: student.batchId,
      studentId,
      teacherId,
      mentorId: auth.payload.sub,
      subject,
      classType,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : 60,
      notes,
      status: "scheduled",
      topic: subject,
      scheduledAt: new Date(`${scheduledDate}T${scheduledTime}:00`),
    },
  });

  return NextResponse.json({ schedule }, { status: 201 });
}
