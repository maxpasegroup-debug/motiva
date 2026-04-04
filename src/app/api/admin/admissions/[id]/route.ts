import { NextRequest, NextResponse } from "next/server";
import {
  getAdmissionRequestById,
  updateAdmissionRequestStatus,
} from "@/server/admissions/admissions-db";
import { getDatabaseUrl } from "@/server/db/pool";
import { requireAdminApi } from "@/server/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const body = (await req.json()) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const status = (body as Record<string, unknown>).status;
  if (status !== "rejected") {
    return NextResponse.json({ error: "Only status rejected supported" }, { status: 400 });
  }

  const row = await getAdmissionRequestById(params.id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (row.status !== "pending") {
    return NextResponse.json({ error: "Not pending" }, { status: 400 });
  }

  const ok = await updateAdmissionRequestStatus(params.id, "rejected");
  if (!ok) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
