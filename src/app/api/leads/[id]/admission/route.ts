import { NextRequest, NextResponse } from "next/server";
import { requireRolesApi } from "@/server/auth/require-roles";
import {
  getLeadById,
  insertPipelineAdmission,
} from "@/server/crm/leads-demos-admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor"] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireRolesApi(req, ROLES);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  const leadId = params.id?.trim() ?? "";
  if (!UUID_RE.test(leadId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const student_name =
    typeof o.student_name === "string" ? o.student_name.trim() : "";
  const parent_name =
    typeof o.parent_name === "string" ? o.parent_name.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const fee_amount_cents =
    typeof o.fee_amount_cents === "number" && Number.isFinite(o.fee_amount_cents)
      ? Math.round(o.fee_amount_cents)
      : null;
  const fee_currency =
    typeof o.fee_currency === "string" ? o.fee_currency.trim() : null;
  const notes =
    typeof o.notes === "string" && o.notes.trim() ? o.notes.trim() : null;

  if (!student_name || !parent_name || !phone) {
    return NextResponse.json(
      { error: "student_name, parent_name, and phone are required" },
      { status: 400 },
    );
  }

  try {
    const lead = await getLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (lead.type === "remedial") {
      return NextResponse.json(
        { error: "Use the remedial admission flow for remedial leads" },
        { status: 400 },
      );
    }
    const { id } = await insertPipelineAdmission({
      lead_id: leadId,
      student_name,
      parent_name,
      phone,
      type: lead.type,
      fee_amount_cents,
      fee_currency: fee_currency ?? undefined,
      notes,
    });
    return NextResponse.json({ success: true, admission_id: id });
  } catch (e) {
    console.error("[POST lead admission]", e);
    return NextResponse.json(
      { error: "Could not create admission" },
      { status: 500 },
    );
  }
}
