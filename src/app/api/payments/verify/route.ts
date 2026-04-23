import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { appendLeadNote } from "@/lib/leads";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { captureException } from "@/lib/sentry";
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
  const razorpayOrderId =
    typeof payload.razorpayOrderId === "string" ? payload.razorpayOrderId.trim() : "";
  const razorpayPaymentId =
    typeof payload.razorpayPaymentId === "string" ? payload.razorpayPaymentId.trim() : "";
  const razorpaySignature =
    typeof payload.razorpaySignature === "string" ? payload.razorpaySignature.trim() : "";
  const leadId = typeof payload.leadId === "string" ? payload.leadId.trim() : "";

  if (!UUID_RE.test(leadId)) {
    return NextResponse.json({ error: "Invalid leadId" }, { status: 400 });
  }
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
  }

  const signatureValid = verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  );

  if (!signatureValid) {
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 400 },
    );
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.paymentTransaction.updateMany({
        where: {
          leadId,
          orderId: razorpayOrderId,
        },
        data: {
          status: "paid",
          razorpayPaymentId,
        },
      }),
      prisma.lead.update({
        where: { id: leadId },
        data: {
          status: "payment_confirmed",
          notes: appendLeadNote(lead.notes, {
            text: `Payment confirmed. Razorpay Payment ID: ${razorpayPaymentId}`,
            timestamp: new Date().toISOString(),
            addedBy: "system",
          }),
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    captureException(error, {
      route: "/api/payments/verify",
      leadId,
      actorId: auth.payload.sub,
    });
    console.error("[POST /api/payments/verify]", error);
    return NextResponse.json(
      { error: "Could not verify payment" },
      { status: 500 },
    );
  }
}
