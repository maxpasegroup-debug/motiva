import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import razorpay from "@/lib/razorpay";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor"] as const;

const createOrderSchema = z.object({
  leadId: z.string().uuid(),
  amount: z.coerce.number().positive().max(1000000),
  currency: z.string().default("INR"),
  notes: z.string().max(1000).optional(),
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

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { leadId, amount: amountInput, currency, notes } = parsed.data;

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
      currency: currency.trim().toUpperCase(),
      notes: {
        leadId,
        studentName: lead.name,
        ...(notes?.trim() ? { notes: notes.trim() } : {}),
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
          currency: currency.trim().toUpperCase(),
          notes: notes?.trim() ?? existingPending.notes,
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
          currency: currency.trim().toUpperCase(),
          status: "pending",
          notes: notes?.trim() ?? "Admission fee",
          recordedBy: auth.payload.sub,
        },
      });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: amountPaise,
      currency: currency.trim().toUpperCase(),
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
