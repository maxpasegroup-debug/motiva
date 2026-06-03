import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRolesApi } from "@/server/auth/require-roles";
import { assignStudentToBatchRoster } from "@/server/batches/batches-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { studentId: string } };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PUT(req: NextRequest, context: Ctx) {
  const auth = await requireRolesApi(req, ["mentor", "admin"]);
  if (!auth.ok) return auth.response;

  const studentId = context.params.studentId;
  if (!UUID_RE.test(studentId)) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
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

  const payload = body as Record<string, unknown>;
  const teacherId = typeof payload.teacherId === "string" ? payload.teacherId.trim() : "";
  const batchId = typeof payload.batchId === "string" ? payload.batchId.trim() : "";

  if (!UUID_RE.test(teacherId)) {
    return NextResponse.json({ error: "Teacher is required" }, { status: 400 });
  }
  if (!UUID_RE.test(batchId)) {
    return NextResponse.json({ error: "Batch is required" }, { status: 400 });
  }

  const [student, teacher, batch] = await Promise.all([
    prisma.studentAccount.findFirst({
      where: {
        id: studentId,
        ...(auth.payload.role === "admin" ? {} : { mentorId: auth.payload.sub }),
      },
      select: { id: true, userId: true, studentName: true },
    }),
    prisma.user.findFirst({
      where: { id: teacherId, role: "teacher", isActive: true },
      select: { id: true, name: true },
    }),
    prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, name: true },
    }),
  ]);

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }
  if (!student.userId) {
    return NextResponse.json(
      { error: "Student login not found for batch roster" },
      { status: 400 },
    );
  }

  await prisma.studentAccount.update({
    where: { id: student.id },
    data: { teacherId, batchId },
  });
  await assignStudentToBatchRoster(student.userId, batchId);

  return NextResponse.json({
    success: true,
    teacherName: teacher.name,
    batchName: batch.name,
  });
}
