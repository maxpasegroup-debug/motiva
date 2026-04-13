import { NextRequest, NextResponse } from "next/server";
import { parseParentIdFromRequest } from "@/server/auth/parent-bearer";
import { getDatabaseUrl } from "@/server/db/pool";
import { markParentNotificationsRead } from "@/server/parents/parents-portal-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const parentId = parseParentIdFromRequest(req);
  if (!parentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const o = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;
  const idsRaw = o.ids;
  if (!Array.isArray(idsRaw)) {
    return NextResponse.json({ error: "ids must be an array" }, { status: 400 });
  }
  const ids = idsRaw.filter((x): x is string => typeof x === "string");
  await markParentNotificationsRead(parentId, ids);
  return NextResponse.json({ success: true });
}
