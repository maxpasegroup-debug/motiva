import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { appendLeadNote, determineProgramTypeFromLead } from "@/lib/leads";
import { sendCredentials } from "@/lib/whatsapp";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor"] as const;
const USERNAME_RE = /^[a-zA-Z0-9]{4,}$/;
const PIN_RE = /^\d{4}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FieldErrors = Partial<
  Record<
    | "leadId"
    | "studentName"
    | "studentUsername"
    | "studentPin"
    | "parentName"
    | "parentUsername"
    | "parentPin",
    string
  >
>;

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

  const payload = body as Record<string, unknown>;
  const leadId = typeof payload.leadId === "string" ? payload.leadId.trim() : "";
  const studentName =
    typeof payload.studentName === "string" ? payload.studentName.trim() : "";
  const studentUsername =
    typeof payload.studentUsername === "string"
      ? payload.studentUsername.trim()
      : "";
  const studentPin =
    typeof payload.studentPin === "string" ? payload.studentPin.trim() : "";
  const parentName =
    typeof payload.parentName === "string" ? payload.parentName.trim() : "";
  const parentUsername =
    typeof payload.parentUsername === "string"
      ? payload.parentUsername.trim()
      : "";
  const parentPin =
    typeof payload.parentPin === "string" ? payload.parentPin.trim() : "";

  const fieldErrors: FieldErrors = {};
  if (!UUID_RE.test(leadId)) fieldErrors.leadId = "Invalid leadId.";
  if (!studentName) fieldErrors.studentName = "Student name is required.";
  if (!USERNAME_RE.test(studentUsername)) {
    fieldErrors.studentUsername =
      "Student username must be alphanumeric and at least 4 characters.";
  }
  if (!PIN_RE.test(studentPin)) {
    fieldErrors.studentPin = "Student PIN must be exactly 4 digits.";
  }
  if (!parentName) fieldErrors.parentName = "Parent name is required.";
  if (!USERNAME_RE.test(parentUsername)) {
    fieldErrors.parentUsername =
      "Parent username must be alphanumeric and at least 4 characters.";
  }
  if (!PIN_RE.test(parentPin)) {
    fieldErrors.parentPin = "Parent PIN must be exactly 4 digits.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors },
      { status: 400 },
    );
  }

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
          fieldErrors: {
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
          fieldErrors: {
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
          fieldErrors: {
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
    console.error("[POST /api/admin/admissions/create-account]", error);
    return NextResponse.json(
      { error: "Could not create accounts" },
      { status: 500 },
    );
  }
}
