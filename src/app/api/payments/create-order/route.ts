import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import razorpay from "@/lib/razorpay";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor"] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  const amountInput =
    typeof payload.amount === "number"
      ? payload.amount
      : typeof payload.amount === "string"
        ? Number(payload.amount)
        : Number.NaN;
  const currency =
    typeof payload.currency === "string" && payload.currency.trim()
      ? payload.currency.trim().toUpperCase()
      : "INR";
  const notes =
    typeof payload.notes === "string" && payload.notes.trim()
      ? payload.notes.trim()
      : null;

  if (!UUID_RE.test(leadId)) {
    return NextResponse.json({ error: "Invalid leadId" }, { status: 400 });
  }
  if (!Number.isFinite(amountInput) || amountInput <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const amountPaise = Math.round(amountInput * 100);
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      notes: {
        leadId,
        studentName: lead.name,
        ...(notes ? { notes } : {}),
      },
    });

    const existingPending = await prisma.paymentTransaction.findFirst({
      where: {
        leadId,
        status: "pending",
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingPending) {
      await prisma.paymentTransaction.update({
        where: { id: existingPending.id },
        data: {
          orderId: order.id,
          amountCents: amountPaise,
          currency,
          notes: notes ?? existingPending.notes,
        },
      });
    } else {
      await prisma.paymentTransaction.create({
        data: {
          leadId,
          orderId: order.id,
          studentId: leadId,
          studentName: lead.name,
          courseLabel: "Admission Fee",
          amountCents: amountPaise,
          currency,
          status: "pending",
          notes: notes ?? "Admission fee",
          recordedBy: auth.payload.sub,
        },
      });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: amountPaise,
      currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[POST /api/payments/create-order]", error);
    return NextResponse.json(
      { error: "Could not create payment order" },
      { status: 500 },
    );
  }
}
