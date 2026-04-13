import { NextRequest, NextResponse } from "next/server";
import { requireRolesApi } from "@/server/auth/require-roles";
import { getLeadById, insertDemo } from "@/server/crm/leads-demos-admissions-db";
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
  const demo_executive_id =
    typeof o.demo_executive_id === "string" ? o.demo_executive_id.trim() : "";
  if (!demo_executive_id) {
    return NextResponse.json(
      { error: "demo_executive_id is required" },
      { status: 400 },
    );
  }

  try {
    const lead = await getLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (lead.type !== "tuition") {
      return NextResponse.json(
        { error: "Demos are only for tuition leads" },
        { status: 400 },
      );
    }
    const { id } = await insertDemo({
      lead_id: leadId,
      demo_executive_id,
    });
    return NextResponse.json({ success: true, demo_id: id });
  } catch (e) {
    console.error("[POST assign-demo]", e);
    return NextResponse.json(
      { error: "Could not assign demo" },
      { status: 500 },
    );
  }
}
