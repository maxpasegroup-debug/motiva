import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/require-admin";
import { listPipelineAdmissions } from "@/server/crm/leads-demos-admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  void req;
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  try {
    const admissions = await listPipelineAdmissions();
    return NextResponse.json({ success: true, admissions });
  } catch (e) {
    console.error("[GET pipeline-admissions]", e);
    return NextResponse.json(
      { error: "Could not list admissions" },
      { status: 500 },
    );
  }
}
