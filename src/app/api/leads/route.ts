import { NextRequest, NextResponse } from "next/server";
import { requireRolesApi } from "@/server/auth/require-roles";
import { insertLead, listLeads } from "@/server/crm/leads-demos-admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor"] as const;

export async function GET(req: NextRequest) {
  const auth = await requireRolesApi(req, ROLES);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  try {
    const leads = await listLeads();
    return NextResponse.json({ success: true, leads });
  } catch (e) {
    console.error("[GET /api/leads]", e);
    return NextResponse.json(
      { error: "Could not list leads" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRolesApi(req, ROLES);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
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
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const type = o.type === "foundation" ? "foundation" : "tuition";
  const subjects =
    typeof o.subjects === "string" && o.subjects.trim()
      ? o.subjects.trim()
      : null;
  const assigned_to =
    typeof o.assigned_to === "string" && o.assigned_to.trim()
      ? o.assigned_to.trim()
      : null;

  if (!name || !phone) {
    return NextResponse.json(
      { error: "name and phone are required" },
      { status: 400 },
    );
  }

  try {
    const { id } = await insertLead({
      name,
      phone,
      type,
      subjects,
      assigned_to,
    });
    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error("[POST /api/leads]", e);
    return NextResponse.json(
      { error: "Could not create lead" },
      { status: 500 },
    );
  }
}
