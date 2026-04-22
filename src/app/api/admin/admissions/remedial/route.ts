import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor"] as const;
const MOBILE_RE = /^\d{10}$/;

type ProgramType = "remedial_12" | "remedial_25";

function programLabel(programType: ProgramType) {
  return programType === "remedial_25"
    ? "25-Day Remedial Program"
    : "12-Day Remedial Program";
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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const studentName =
    typeof payload.studentName === "string" ? payload.studentName.trim() : "";
  const parentName =
    typeof payload.parentName === "string" ? payload.parentName.trim() : "";
  const mobileRaw = typeof payload.mobile === "string" ? payload.mobile : "";
  const mobile = mobileRaw.replace(/\D/g, "");
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const programType =
    payload.programType === "remedial_12" || payload.programType === "remedial_25"
      ? payload.programType
      : "";
  const feeAmount =
    typeof payload.feeAmount === "number"
      ? payload.feeAmount
      : typeof payload.feeAmount === "string"
        ? Number(payload.feeAmount)
        : Number.NaN;
  const notes = typeof payload.notes === "string" ? payload.notes.trim() : "";

  const fieldErrors: Record<string, string> = {};
  if (!studentName) fieldErrors.studentName = "Student name is required.";
  if (!parentName) fieldErrors.parentName = "Parent name is required.";
  if (!MOBILE_RE.test(mobile)) {
    fieldErrors.mobile = "Mobile number must be exactly 10 digits.";
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }
  if (programType !== "remedial_12" && programType !== "remedial_25") {
    fieldErrors.programType = "Program type must be remedial_12 or remedial_25.";
  }
  if (!Number.isFinite(feeAmount) || feeAmount <= 0) {
    fieldErrors.feeAmount = "Fee amount must be greater than 0.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors },
      { status: 400 },
    );
  }

  const initialNoteText = [
    `Direct remedial admission. Program: ${programType}. Fee: Rs ${Math.round(feeAmount)}. Parent: ${parentName}.`,
    email ? `Email: ${email}.` : null,
    notes || null,
  ]
    .filter(Boolean)
    .join(" ");

  try {
    const lead = await prisma.$transaction(async (tx) => {
      const createdLead = await tx.lead.create({
        data: {
          name: studentName,
          phone: mobile,
          type: "remedial",
          subjects: programLabel(programType as ProgramType),
          flowType: "remedial",
          status: "admission",
          assignedTo: auth.payload.sub,
          notes: JSON.stringify([
            {
              text: initialNoteText,
              timestamp: new Date().toISOString(),
              addedBy: auth.payload.sub,
            },
          ]),
        },
      });

      // studentId remains required in the current payments table, so we use the lead id
      // until the student account is created later in the flow.
      await tx.paymentTransaction.create({
        data: {
          leadId: createdLead.id,
          orderId: null,
          studentId: createdLead.id,
          studentName,
          courseLabel: programLabel(programType as ProgramType),
          amountCents: Math.round(feeAmount * 100),
          currency: "INR",
          status: "pending",
          notes: "Remedial admission fee",
          recordedBy: auth.payload.sub,
        },
      });

      return createdLead;
    });

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error("[POST /api/admin/admissions/remedial]", error);
    return NextResponse.json(
      { error: "Could not create remedial admission" },
      { status: 500 },
    );
  }
}
