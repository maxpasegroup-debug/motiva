import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { appendLeadNote, determineProgramTypeFromLead } from "@/lib/leads";
import { captureException } from "@/lib/sentry";
import { sendCredentials } from "@/lib/whatsapp";
import { requireRolesApi } from "@/server/auth/require-roles";
import { hashPin, isFourDigitPin, normalizeMobile } from "@/server/auth/unified-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor"] as const;

const createAccountSchema = z.object({
  leadId: z.string().uuid(),
  studentName: z.string().trim().min(2).max(100),
  parentName: z.string().trim().min(2).max(100),
  mobile: z.string().transform((value) => normalizeMobile(value)).pipe(
    z.string().regex(/^\d{10}$/, "Student mobile must be 10 digits"),
  ),
  studentPin: z.string().refine(isFourDigitPin, "Student PIN must be 4 digits"),
  parentMobile: z.string().transform((value) => normalizeMobile(value)).pipe(
    z.string().regex(/^\d{10}$/, "Parent mobile must be 10 digits"),
  ),
  parentPin: z.string().refine(isFourDigitPin, "Parent PIN must be 4 digits"),
});

function usernameFromMobile(prefix: string, mobile: string) {
  return `${prefix}_${mobile}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireRolesApi(req, ROLES);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { leadId, studentName, parentName, mobile, studentPin, parentMobile, parentPin } =
    parsed.data;

  if (mobile === parentMobile && studentPin === parentPin) {
    return NextResponse.json(
      {
        error: "Use different PINs when student and parent share a mobile number.",
      },
      { status: 400 },
    );
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
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

    const [existingStudentUser, existingParentUser, existingStudentAccount, existingParentAccount] =
      await Promise.all([
        prisma.user.findFirst({ where: { mobile, role: "student" }, select: { id: true } }),
        prisma.user.findFirst({
          where: { mobile: parentMobile, role: "parent" },
          select: { id: true },
        }),
        prisma.studentAccount.findUnique({ where: { mobile }, select: { id: true } }),
        prisma.parentAccount.findUnique({
          where: { mobile: parentMobile },
          select: { id: true },
        }),
      ]);

    if (existingStudentUser || existingStudentAccount) {
      return NextResponse.json({ error: "Student mobile already exists" }, { status: 409 });
    }
    if (existingParentUser || existingParentAccount) {
      return NextResponse.json({ error: "Parent mobile already exists" }, { status: 409 });
    }

    const studentPinHash = await hashPin(studentPin);
    const parentPinHash = await hashPin(parentPin);
    const programType = determineProgramTypeFromLead({
      type: lead.type,
      notes: lead.notes,
    });

    const result = await prisma.$transaction(async (tx) => {
      const studentUser = await tx.user.create({
        data: {
          name: studentName,
          mobile,
          pin: studentPinHash,
          role: "student",
          isActive: true,
          createdBy: auth.payload.sub,
        },
      });

      const parentUser = await tx.user.create({
        data: {
          name: parentName,
          mobile: parentMobile,
          pin: parentPinHash,
          role: "parent",
          isActive: true,
          createdBy: auth.payload.sub,
        },
      });

      const studentAccount = await tx.studentAccount.create({
        data: {
          userId: studentUser.id,
          studentName,
          parentName,
          mobile,
          username: usernameFromMobile("student", mobile),
          pin: studentPinHash,
          role: "student",
          programType,
          admissionStatus: "active",
          createdBy: auth.payload.sub,
        },
      });

      await tx.parentAccount.create({
        data: {
          userId: parentUser.id,
          name: parentName,
          mobile: parentMobile,
          username: usernameFromMobile("parent", parentMobile),
          pin: parentPinHash,
          role: "parent",
          studentId: studentAccount.id,
          createdBy: auth.payload.sub,
        },
      });

      await tx.parent.upsert({
        where: { id: parentUser.id },
        update: {
          name: parentName,
          phone: parentMobile,
          phoneNormalized: parentMobile,
          studentId: studentAccount.id,
          email: null,
        },
        create: {
          id: parentUser.id,
          name: parentName,
          phone: parentMobile,
          phoneNormalized: parentMobile,
          studentId: studentAccount.id,
          email: null,
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: "account_created",
          notes: appendLeadNote(lead.notes, {
            text: `Accounts created. Student mobile: ${mobile}. Parent mobile: ${parentMobile}.`,
            timestamp: new Date().toISOString(),
            addedBy: auth.payload.sub,
          }),
        },
      });

      return { studentUser, parentUser, studentAccount };
    });

    try {
      await sendCredentials(mobile, studentName, mobile, studentPin);
      await sendCredentials(parentMobile, parentName, parentMobile, parentPin);
    } catch (whatsappError) {
      console.error("[sendCredentials]", whatsappError);
    }

    return NextResponse.json({
      success: true,
      studentAccountId: result.studentAccount.id,
      credentials: {
        student: { mobile, pin: studentPin },
        parent: { mobile: parentMobile, pin: parentPin },
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
