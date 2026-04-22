import { NextRequest, NextResponse } from "next/server";
import { requireRolesApi } from "@/server/auth/require-roles";
import {
  assignLead,
  getLeadById,
  updateLeadStatus,
} from "@/server/crm/leads-demos-admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";
import { getLegacyLeadStatus, type LeadStatus } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor"] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
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

  const id = params.id?.trim() ?? "";
  if (!UUID_RE.test(id)) {
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

  try {
    const existing = await getLeadById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (typeof o.status === "string") {
      const allowed = ["new", "demo", "admission", "closed"] as const;
      type LegacyLeadStatus = (typeof allowed)[number];
      const st = o.status as LegacyLeadStatus;
      if (!allowed.includes(st)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      const mappedStatus: LeadStatus =
        st === "demo"
          ? "demo_scheduled"
          : st === "closed"
            ? "closed_lost"
            : st;
      await updateLeadStatus(id, mappedStatus);
    }

    if (o.assigned_to !== undefined) {
      const v =
        o.assigned_to === null
          ? null
          : typeof o.assigned_to === "string"
            ? o.assigned_to
            : undefined;
      if (v !== undefined) {
        await assignLead(id, v);
      }
    }

    const lead = await getLeadById(id);
    const legacyLead = lead
      ? {
          ...lead,
          status: getLegacyLeadStatus(lead.status),
        }
      : null;
    return NextResponse.json({ success: true, lead: legacyLead });
  } catch (e) {
    console.error("[PATCH /api/leads/[id]]", e);
    return NextResponse.json(
      { error: "Could not update lead" },
      { status: 500 },
    );
  }
}
