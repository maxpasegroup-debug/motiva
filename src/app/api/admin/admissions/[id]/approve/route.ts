import { NextRequest, NextResponse } from "next/server";
import { approveAdmissionInDatabase } from "@/server/admissions/approve-request";
import { getDatabaseUrl } from "@/server/db/pool";
import { requireAdminApi } from "@/server/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  void req;

  const result = await approveAdmissionInDatabase(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    student: result.data.student,
    parent: result.data.parent,
  });
}
