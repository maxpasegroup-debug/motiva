import { NextRequest, NextResponse } from "next/server";
import { requireRolesApi } from "@/server/auth/require-roles";
import { listDemosForExecutive } from "@/server/crm/leads-demos-admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "demo_executive"] as const;

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
    const executiveId =
      auth.payload.role === "admin"
        ? (req.nextUrl.searchParams.get("executive_id")?.trim() ?? "")
        : auth.payload.sub;
    if (!executiveId) {
      return NextResponse.json(
        { error: "executive_id query required for admin" },
        { status: 400 },
      );
    }
    const demos = await listDemosForExecutive(executiveId);
    return NextResponse.json({ success: true, demos });
  } catch (e) {
    console.error("[GET /api/demos]", e);
    return NextResponse.json(
      { error: "Could not list demos" },
      { status: 500 },
    );
  }
}
