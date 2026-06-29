import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { appendLeadNote } from "@/lib/leads";
import { requireAdminApi } from "@/server/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toRupees(cents: number | null | undefined) {
  return Math.max(0, (cents ?? 0) / 100);
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  try {
    const admissions = await prisma.admission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        lead: true,
      },
    });
    const leadIds = admissions.map((row) => row.leadId);
    const payments = await prisma.paymentTransaction.findMany({
      where: { leadId: { in: leadIds } },
      orderBy: { createdAt: "desc" },
    });

    const rows = admissions.map((admission) => {
      const history = payments.filter((payment) => payment.leadId === admission.leadId);
      const paidCents = history
        .filter((payment) => payment.status === "paid")
        .reduce((sum, payment) => sum + payment.amountCents, 0);
      const totalCents = admission.feeAmountCents ?? 0;
      return {
        admission: {
          id: admission.id,
          leadId: admission.leadId,
          studentName: admission.studentName,
          parentName: admission.parentName,
          phone: admission.phone,
          type: admission.type,
          status: admission.status,
          totalFee: toRupees(admission.feeAmountCents),
          currency: admission.feeCurrency ?? "INR",
          notes: admission.notes,
          createdAt: admission.createdAt,
        },
        lead: {
          id: admission.lead.id,
          status: admission.lead.status,
          subjects: admission.lead.subjects,
        },
        paid: toRupees(paidCents),
        pending: toRupees(Math.max(0, totalCents - paidCents)),
        payments: history.map((payment) => ({
          id: payment.id,
          amount: toRupees(payment.amountCents),
          currency: payment.currency,
          status: payment.status,
          notes: payment.notes,
          recordedBy: payment.recordedBy,
          createdAt: payment.createdAt,
        })),
      };
    });

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("[GET /api/admin/payments]", error);
    return NextResponse.json(
      { error: "Could not load payments" },
      { status: 500 },
    );
  }
}

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
  const admissionId =
    typeof payload.admissionId === "string" ? payload.admissionId.trim() : "";
  const amount = Number(payload.amount);
  const notes =
    typeof payload.notes === "string" && payload.notes.trim()
      ? payload.notes.trim()
      : "Fee payment recorded.";

  if (!admissionId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Admission and valid amount are required" },
      { status: 400 },
    );
  }

  try {
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { lead: true },
    });
    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }

    const amountCents = Math.round(amount * 100);
    const existingPaid = await prisma.paymentTransaction.aggregate({
      where: { leadId: admission.leadId, status: "paid" },
      _sum: { amountCents: true },
    });
    const totalPaidCents = (existingPaid._sum.amountCents ?? 0) + amountCents;
    const totalFeeCents = admission.feeAmountCents ?? 0;
    const isFullyPaid = totalFeeCents > 0 && totalPaidCents >= totalFeeCents;
    const nextStatus = isFullyPaid ? "payment_confirmed" : "payment_pending";

    await prisma.$transaction([
      prisma.paymentTransaction.create({
        data: {
          leadId: admission.leadId,
          studentId: admission.leadId,
          studentName: admission.studentName,
          courseLabel: admission.lead.subjects || "Admission Fee",
          amountCents,
          currency: admission.feeCurrency ?? "INR",
          status: "paid",
          notes,
          recordedBy: auth.payload.name || auth.payload.sub,
        },
      }),
      prisma.lead.update({
        where: { id: admission.leadId },
        data: {
          status: nextStatus,
          notes: appendLeadNote(admission.lead.notes, {
            text: `Fee payment recorded: INR ${amount}. ${notes}`,
            addedBy: auth.payload.name || auth.payload.role,
          }),
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/admin/payments]", error);
    return NextResponse.json(
      { error: "Could not record payment" },
      { status: 500 },
    );
  }
}
