import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function parseSubjects(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((subject) => {
      if (!subject || typeof subject !== "object") {
        return null;
      }

      const record = subject as Record<string, unknown>;
      const subjectName =
        typeof record.subjectName === "string" ? record.subjectName.trim() : "";
      const dailyTargetMinutes =
        typeof record.dailyTargetMinutes === "number"
          ? record.dailyTargetMinutes
          : typeof record.dailyTargetMinutes === "string"
            ? Number(record.dailyTargetMinutes)
            : 0;
      const notes = typeof record.notes === "string" ? record.notes.trim() : "";

      if (!subjectName) {
        return null;
      }

      return {
        subjectName,
        dailyTargetMinutes: Number.isFinite(dailyTargetMinutes)
          ? dailyTargetMinutes
          : 0,
        notes,
      };
    })
    .filter((subject): subject is { subjectName: string; dailyTargetMinutes: number; notes: string } => subject !== null);
}

async function verifyMentorStudent(studentId: string, mentorId: string) {
  return prisma.studentAccount.findFirst({
    where: {
      id: studentId,
      mentorId,
    },
    select: {
      id: true,
      batchId: true,
    },
  });
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
  const startDate = payload.startDate;
  const endDate = payload.endDate;
  const status = typeof payload.status === "string" ? payload.status.trim() : "active";
  const subjects = parseSubjects(payload.subjects);
  const goals = typeof payload.goals === "string" ? payload.goals.trim() : "";
  const revisionCycle =
    typeof payload.revisionCycle === "string" ? payload.revisionCycle.trim() : "";
  const notes = typeof payload.notes === "string" ? payload.notes.trim() : "";

  if (!studentId || !isValidDate(startDate) || !isValidDate(endDate)) {
    return NextResponse.json({ error: "Student and dates are required" }, { status: 400 });
  }
  if (subjects.length === 0) {
    return NextResponse.json({ error: "Add at least one subject" }, { status: 400 });
  }

  const student = await verifyMentorStudent(studentId, auth.payload.sub);
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const plan = await prisma.learningPlan.create({
    data: {
      studentId,
      title: "Learning Plan",
      description: goals || null,
      batchId: student.batchId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      subjects,
      goals,
      revisionCycle,
      notes,
      createdBy: auth.payload.sub,
    },
  });

  return NextResponse.json({ plan });
}

export async function PUT(req: NextRequest) {
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
  const planId = typeof payload.planId === "string" ? payload.planId.trim() : "";
  const studentId = typeof payload.studentId === "string" ? payload.studentId.trim() : "";
  const startDate = payload.startDate;
  const endDate = payload.endDate;
  const status = typeof payload.status === "string" ? payload.status.trim() : "active";
  const subjects = parseSubjects(payload.subjects);
  const goals = typeof payload.goals === "string" ? payload.goals.trim() : "";
  const revisionCycle =
    typeof payload.revisionCycle === "string" ? payload.revisionCycle.trim() : "";
  const notes = typeof payload.notes === "string" ? payload.notes.trim() : "";

  if (!planId || !studentId || !isValidDate(startDate) || !isValidDate(endDate)) {
    return NextResponse.json({ error: "Plan, student, and dates are required" }, { status: 400 });
  }

  const plan = await prisma.learningPlan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      studentId: true,
    },
  });

  if (!plan || plan.studentId !== studentId) {
    return NextResponse.json({ error: "Learning plan not found" }, { status: 404 });
  }

  const student = await verifyMentorStudent(studentId, auth.payload.sub);
  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const updatedPlan = await prisma.learningPlan.update({
    where: { id: planId },
    data: {
      description: goals || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      subjects,
      goals,
      revisionCycle,
      notes,
      batchId: student.batchId,
    },
  });

  return NextResponse.json({ plan: updatedPlan });
}
