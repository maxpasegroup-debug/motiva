import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { appendLeadNote } from "@/lib/leads";
import { onboardPaidLead } from "@/server/admissions/onboard-paid-lead";
import { requireRolesApi } from "@/server/auth/require-roles";
import { normalizeMobile } from "@/server/auth/unified-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const schema = z.object({
  studentName: z.string().trim().min(2).max(100),
  parentName: z.string().trim().min(2).max(100),
  phone: z.string().transform((value) => normalizeMobile(value)).pipe(
    z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
  ),
  programType: z.enum([
    "tuition",
    "foundation",
    "remedial_12",
    "remedial_25",
    "spoken_english",
    "madrassa",
  ]),
  subject: z.string().trim().min(2).max(255),
  totalFee: z.number().finite().positive(),
  amountPaid: z.number().finite().min(0),
  teacherId: z.string().regex(UUID_RE, "Teacher is required"),
  batchId: z.string().regex(UUID_RE, "Batch is required"),
  remarks: z.string().trim().max(2000).optional(),
});

function leadTypeFromProgram(programType: string): "tuition" | "foundation" | "remedial" {
  if (programType === "tuition" || programType === "madrassa") return "tuition";
  if (programType === "remedial_12" || programType === "remedial_25") {
    return "remedial";
  }
  return "foundation";
}

function flowTypeFromProgram(programType: string): "tuition" | "remedial" {
  return programType === "remedial_12" || programType === "remedial_25"
    ? "remedial"
    : "tuition";
}

function admissionTypeFromProgram(programType: string): "tuition" | "foundation" {
  return programType === "tuition" || programType === "madrassa"
    ? "tuition"
    : "foundation";
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const totalFeeCents = Math.round(input.totalFee * 100);
  const amountPaidCents = Math.round(input.amountPaid * 100);
  if (amountPaidCents > totalFeeCents) {
    return NextResponse.json(
      { error: "Amount paid cannot be greater than total fee" },
      { status: 400 },
    );
  }

  const [teacher, batch] = await Promise.all([
    prisma.user.findFirst({
      where: { id: input.teacherId, role: "teacher", isActive: true },
      select: { id: true, name: true },
    }),
    prisma.batch.findFirst({
      where: { id: input.batchId, teacherId: input.teacherId },
      select: { id: true, name: true },
    }),
  ]);

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }
  if (!batch) {
    return NextResponse.json(
      { error: "Batch not found for selected teacher" },
      { status: 404 },
    );
  }

  const paidInFull = amountPaidCents >= totalFeeCents;
  const leadType = leadTypeFromProgram(input.programType);
  const flowType = flowTypeFromProgram(input.programType);
  const admissionType = admissionTypeFromProgram(input.programType);
  const note = [
    `Mentor-created admission. Program: ${input.programType}.`,
    `Subject: ${input.subject}.`,
    `Teacher: ${teacher.name}. Batch: ${batch.name}.`,
    input.remarks ? `Remarks: ${input.remarks}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const created = await prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          name: input.studentName,
          phone: input.phone,
          type: leadType,
          subjects: input.subject,
          flowType,
          status: amountPaidCents > 0 ? "payment_pending" : "admission",
          assignedTo: auth.payload.sub,
          assignedMentorId: auth.payload.sub,
          notes: appendLeadNote(null, {
            text: note,
            addedBy: auth.payload.name || auth.payload.sub,
          }),
        },
      });

      const admission = await tx.admission.create({
        data: {
          leadId: lead.id,
          studentName: input.studentName,
          parentName: input.parentName,
          phone: input.phone,
          type: admissionType,
          status: "pending",
          feeAmountCents: totalFeeCents,
          feeCurrency: "INR",
          notes: appendLeadNote(null, {
            text: note,
            addedBy: auth.payload.name || auth.payload.sub,
          }),
        },
      });

      if (amountPaidCents > 0) {
        await tx.paymentTransaction.create({
          data: {
            leadId: lead.id,
            studentId: lead.id,
            studentName: input.studentName,
            courseLabel: input.subject,
            amountCents: amountPaidCents,
            currency: "INR",
            status: "paid",
            notes: input.remarks || "Mentor-recorded admission payment.",
            recordedBy: auth.payload.name || auth.payload.sub,
          },
        });
      }

      return { lead, admission };
    });

    const onboarding = paidInFull
      ? await onboardPaidLead(
          created.lead.id,
          {
            id: auth.payload.sub,
            name: auth.payload.name,
            role: auth.payload.role,
          },
          {
            preferredMentorId: auth.payload.sub,
            preferredTeacherId: input.teacherId,
            preferredBatchId: input.batchId,
          },
        )
      : null;

    return NextResponse.json({
      success: true,
      leadId: created.lead.id,
      admissionId: created.admission.id,
      studentAccountId: onboarding?.ok ? onboarding.studentAccountId : null,
      paymentStatus: paidInFull ? "paid" : "partial",
      onboarding,
    });
  } catch (error) {
    console.error("[POST /api/mentor/admissions]", error);
    return NextResponse.json(
      { error: "Could not create mentor admission" },
      { status: 500 },
    );
  }
}
