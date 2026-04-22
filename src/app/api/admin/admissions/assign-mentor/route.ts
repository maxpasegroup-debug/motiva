import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { appendLeadNote } from "@/lib/leads";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { requireAdminApi } from "@/server/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
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
  const leadId =
    typeof payload.leadId === "string" ? payload.leadId.trim() : "";
  const studentAccountId =
    typeof payload.studentAccountId === "string"
      ? payload.studentAccountId.trim()
      : "";
  const mentorId =
    typeof payload.mentorId === "string" ? payload.mentorId.trim() : "";
  const teacherId =
    typeof payload.teacherId === "string" ? payload.teacherId.trim() : "";
  const batchId =
    typeof payload.batchId === "string" && payload.batchId.trim()
      ? payload.batchId.trim()
      : undefined;
  const notes =
    typeof payload.notes === "string" && payload.notes.trim()
      ? payload.notes.trim()
      : undefined;

  if (!UUID_RE.test(leadId)) {
    return NextResponse.json({ error: "Invalid leadId" }, { status: 400 });
  }
  if (!UUID_RE.test(studentAccountId)) {
    return NextResponse.json(
      { error: "Invalid studentAccountId" },
      { status: 400 },
    );
  }
  if (!UUID_RE.test(mentorId)) {
    return NextResponse.json(
      { error: "Mentor is required" },
      { status: 400 },
    );
  }
  if (!UUID_RE.test(teacherId)) {
    return NextResponse.json(
      { error: "Teacher is required" },
      { status: 400 },
    );
  }
  if (batchId && !UUID_RE.test(batchId)) {
    return NextResponse.json({ error: "Invalid batchId" }, { status: 400 });
  }

  try {
    const [lead, studentAccount, mentor, teacher, batch] = await Promise.all([
      prisma.lead.findUnique({
        where: { id: leadId },
        select: { id: true, name: true, phone: true, notes: true, status: true },
      }),
      prisma.studentAccount.findUnique({
        where: { id: studentAccountId },
        select: { id: true, studentName: true, programType: true },
      }),
      prisma.user.findUnique({
        where: { id: mentorId },
        select: { id: true, name: true, mobile: true },
      }),
      prisma.user.findUnique({
        where: { id: teacherId },
        select: { id: true, name: true },
      }),
      batchId
        ? prisma.batch.findUnique({
            where: { id: batchId },
            select: { id: true, name: true },
          })
        : Promise.resolve(null),
    ]);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (!studentAccount) {
      return NextResponse.json(
        { error: "Student account not found" },
        { status: 404 },
      );
    }
    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }
    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found" },
        { status: 404 },
      );
    }
    if (batchId && !batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const noteParts = [
      `Mentor assigned: ${mentor.name}.`,
      `Teacher assigned: ${teacher.name}.`,
      batch ? `Batch assigned: ${batch.name}.` : null,
      notes ? `Notes: ${notes}` : null,
    ].filter(Boolean);

    await prisma.$transaction([
      prisma.studentAccount.update({
        where: { id: studentAccountId },
        data: {
          mentorId,
          teacherId,
          ...(batchId ? { batchId } : {}),
        },
      }),
      prisma.lead.update({
        where: { id: leadId },
        data: {
          assignedMentorId: mentorId,
          notes: appendLeadNote(lead.notes, {
            text: noteParts.join(" "),
            timestamp: new Date().toISOString(),
            addedBy: auth.payload.sub,
          }),
        },
      }),
    ]);

    if (mentor.mobile) {
      try {
        await sendWhatsAppMessage(
          mentor.mobile,
          `Hi ${mentor.name}, you have been assigned as mentor for ${studentAccount.studentName} at Motiva Edus.${batch ? ` Batch: ${batch.name}.` : ""}`,
        );
      } catch (whatsappError) {
        console.error("[assign-mentor sendWhatsApp]", whatsappError);
      }
    }

    return NextResponse.json({
      success: true,
      mentorName: mentor.name,
      teacherName: teacher.name,
      batchName: batch?.name,
    });
  } catch (error) {
    console.error("[POST /api/admin/admissions/assign-mentor]", error);
    return NextResponse.json(
      { error: "Could not assign mentor" },
      { status: 500 },
    );
  }
}
