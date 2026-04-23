import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { appendLeadNote, determineProgramTypeFromLead } from "@/lib/leads";
import { captureException } from "@/lib/sentry";
import { sendCredentials } from "@/lib/whatsapp";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor"] as const;
const createAccountSchema = z.object({
  leadId: z.string().uuid(),
  studentName: z.string().trim().min(2).max(100),
  studentUsername: z.string().regex(/^[a-z0-9]{4,64}$/),
  studentPin: z.string().regex(/^\d{4}$/),
  parentName: z.string().trim().min(2).max(100),
  parentUsername: z.string().regex(/^[a-z0-9]{4,64}$/),
  parentPin: z.string().regex(/^\d{4}$/),
});

export async function POST(req: NextRequest) {
  const auth = await requireRolesApi(req, ROLES);
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

  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const {
    leadId,
    studentName,
    studentUsername,
    studentPin,
    parentName,
    parentUsername,
    parentPin,
  } = parsed.data;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        name: true,
        phone: true,
        type: true,
        notes: true,
        status: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (lead.status !== "payment_confirmed") {
      return NextResponse.json(
        { error: "Payment must be confirmed before creating account" },
        { status: 400 },
      );
    }

    const [existingStudentUsername, existingParentUsername, existingMobile] =
      await Promise.all([
        prisma.studentAccount.findUnique({
          where: { username: studentUsername },
          select: { id: true },
        }),
        prisma.parentAccount.findUnique({
          where: { username: parentUsername },
          select: { id: true },
        }),
        prisma.studentAccount.findUnique({
          where: { mobile: lead.phone },
          select: { id: true },
        }),
      ]);

    if (existingStudentUsername) {
      return NextResponse.json(
        {
          error: "Student username already exists",
          details: {
            studentUsername: "Student username already exists.",
          },
        },
        { status: 409 },
      );
    }
    if (existingParentUsername) {
      return NextResponse.json(
        {
          error: "Parent username already exists",
          details: {
            parentUsername: "Parent username already exists.",
          },
        },
        { status: 409 },
      );
    }
    if (existingMobile) {
      return NextResponse.json(
        {
          error: "Mobile already has a student account",
          details: {
            leadId: "A student account already exists for this mobile number.",
          },
        },
        { status: 409 },
      );
    }

    const studentPinHash = await bcrypt.hash(studentPin, 10);
    const parentPinHash = await bcrypt.hash(parentPin, 10);
    const programType = determineProgramTypeFromLead({
      type: lead.type,
      notes: lead.notes,
    });

    const student = await prisma.$transaction(async (tx) => {
      const createdStudent = await tx.studentAccount.create({
        data: {
          studentName,
          parentName,
          mobile: lead.phone,
          username: studentUsername,
          pin: studentPinHash,
          role: "student",
          programType,
          admissionStatus: "active",
          createdBy: auth.payload.sub,
        },
      });

      await tx.parentAccount.create({
        data: {
          name: parentName,
          mobile: lead.phone,
          username: parentUsername,
          pin: parentPinHash,
          role: "parent",
          studentId: createdStudent.id,
          createdBy: auth.payload.sub,
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: "mentor_assigned",
          notes: appendLeadNote(lead.notes, {
            text: `Student account created. Username: ${studentUsername}. Parent account created. Username: ${parentUsername}.`,
            timestamp: new Date().toISOString(),
            addedBy: auth.payload.sub,
          }),
        },
      });

      return createdStudent;
    });

    try {
      await sendCredentials(lead.phone, studentName, studentUsername, studentPin);
    } catch (whatsappError) {
      console.error("[sendCredentials]", whatsappError);
    }

    return NextResponse.json({
      success: true,
      studentAccountId: student.id,
      credentials: {
        student: { username: studentUsername, pin: studentPin },
        parent: { username: parentUsername, pin: parentPin },
      },
    });
  } catch (error) {
    captureException(error, {
      route: "/api/admin/admissions/create-account",
      actorId: auth.payload.sub,
    });
    console.error("[POST /api/admin/admissions/create-account]", error);
    return NextResponse.json(
      { error: "Could not create accounts" },
      { status: 500 },
    );
  }
}
