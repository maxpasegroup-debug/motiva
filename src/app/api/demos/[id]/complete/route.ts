import { NextRequest, NextResponse } from "next/server";
import { requireRolesApi } from "@/server/auth/require-roles";
import {
  completeDemo,
  getDemoById,
} from "@/server/crm/leads-demos-admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "demo_executive"] as const;

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
  const result =
    o.result === "not_interested" ? "not_interested" : "interested";
  const notes =
    typeof o.notes === "string" && o.notes.trim() ? o.notes.trim() : null;

  try {
    const existing = await getDemoById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (
      auth.payload.role === "demo_executive" &&
      existing.demo_executive_id !== auth.payload.sub
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const row = await completeDemo(id, { result, notes });
    if (!row) {
      return NextResponse.json(
        { error: "Demo already completed" },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true, demo: row });
  } catch (e) {
    console.error("[POST demos/complete]", e);
    return NextResponse.json(
      { error: "Could not complete demo" },
      { status: 500 },
    );
  }
}
