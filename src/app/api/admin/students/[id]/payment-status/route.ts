import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/require-admin";
import { getDatabaseUrl } from "@/server/db/pool";
import { upsertStudentPaymentStatusDb } from "@/server/parents/parents-portal-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const studentId = params.id?.trim();
  if (!studentId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;
  const status = o.status === "paid" ? "paid" : "pending";

  try {
    await upsertStudentPaymentStatusDb(studentId, status);
    return NextResponse.json({ success: true, status });
  } catch (e) {
    console.error("[PATCH payment-status]", e);
    return NextResponse.json(
      { error: "Could not update payment status" },
      { status: 500 },
    );
  }
}
