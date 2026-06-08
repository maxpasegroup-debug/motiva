import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { sendCredentials } from "@/lib/whatsapp";
import { requireRolesApi } from "@/server/auth/require-roles";
import { hashPin, isFourDigitPin, normalizeMobile } from "@/server/auth/unified-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor", "mentor"] as const;

const schema = z.object({
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
  email: z.string().trim().email().optional().or(z.literal("")),
  programType: z.string().trim().min(2).max(32).default("tuition"),
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    studentName,
    parentName,
    mobile,
    studentPin,
    parentMobile,
    parentPin,
    email,
    programType,
  } = parsed.data;

  if (mobile === parentMobile && studentPin === parentPin) {
    return NextResponse.json(
      { error: "Use different PINs when student and parent share a mobile number." },
      { status: 400 },
    );
  }

  const [existingStudentUser, existingParentUser, existingStudentAccount, existingParentAccount] =
    await Promise.all([
      prisma.user.findFirst({ where: { mobile, role: "student" }, select: { id: true } }),
      prisma.user.findFirst({ where: { mobile: parentMobile, role: "parent" }, select: { id: true } }),
      prisma.studentAccount.findUnique({ where: { mobile }, select: { id: true } }),
      prisma.parentAccount.findUnique({ where: { mobile: parentMobile }, select: { id: true } }),
    ]);

  if (existingStudentUser || existingStudentAccount) {
    return NextResponse.json({ error: "Student mobile already exists" }, { status: 409 });
  }
  if (existingParentUser || existingParentAccount) {
    return NextResponse.json({ error: "Parent mobile already exists" }, { status: 409 });
  }

  const studentPinHash = await hashPin(studentPin);
  const parentPinHash = await hashPin(parentPin);
  const mentorId = auth.payload.role === "mentor" ? auth.payload.sub : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const studentUser = await tx.user.create({
        data: {
          name: studentName,
          mobile,
          pin: studentPinHash,
          role: "student",
          isActive: true,
          pinResetRequired: false,
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
          pinResetRequired: false,
          createdBy: auth.payload.sub,
        },
      });

      const studentAccount = await tx.studentAccount.create({
        data: {
          userId: studentUser.id,
          studentName,
          parentName,
          mobile,
          email: email || null,
          username: usernameFromMobile("student", mobile),
          pin: studentPinHash,
          role: "student",
          programType,
          admissionStatus: "active",
          mentorId,
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

      return studentAccount;
    });

    try {
      await sendCredentials(mobile, studentName, mobile, studentPin);
      await sendCredentials(parentMobile, parentName, parentMobile, parentPin);
    } catch (error) {
      console.error("[sendCredentials direct student]", error);
    }

    return NextResponse.json({
      success: true,
      studentAccountId: result.id,
      credentials: {
        student: { mobile, pin: studentPin },
        parent: { mobile: parentMobile, pin: parentPin },
      },
    });
  } catch (error) {
    console.error("[POST /api/admin/students]", error);
    return NextResponse.json({ error: "Could not create student" }, { status: 500 });
  }
}
