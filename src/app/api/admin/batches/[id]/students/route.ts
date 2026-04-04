import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/require-admin";
import { getBatchById, setBatchStudents } from "@/server/batches/batches-db";
import { getDatabaseUrl } from "@/server/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PUT(
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

  const batchId = params.id;
  if (!UUID_RE.test(batchId)) {
    return NextResponse.json({ error: "Invalid batch id" }, { status: 400 });
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
  const student_ids = (body as Record<string, unknown>).student_ids;
  if (!Array.isArray(student_ids) || !student_ids.every((x) => typeof x === "string")) {
    return NextResponse.json(
      { error: "student_ids must be an array of strings" },
      { status: 400 },
    );
  }

  try {
    const batch = await getBatchById(batchId);
    if (!batch) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await setBatchStudents(batchId, student_ids as string[]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[PUT /api/admin/batches/[id]/students]", e);
    return NextResponse.json(
      { error: "Could not save roster" },
      { status: 500 },
    );
  }
}
