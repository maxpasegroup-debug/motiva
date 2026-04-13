import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/require-admin";
import { getDatabaseUrl } from "@/server/db/pool";
import {
  createParentNotification,
  upsertParentRecord,
} from "@/server/parents/parents-portal-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
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
  const o = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;
  const parentId = typeof o.parentId === "string" ? o.parentId : "";
  const studentId = typeof o.studentId === "string" ? o.studentId : "";
  const name = typeof o.name === "string" ? o.name : "";
  const phone = typeof o.phone === "string" ? o.phone : "";
  const email =
    typeof o.email === "string" && o.email.trim() ? o.email.trim() : null;
  const notifyEnrolled = o.notifyEnrolled === true;

  if (!parentId || !studentId || !name.trim() || !phone.trim()) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  try {
    await upsertParentRecord({
      id: parentId,
      name: name.trim(),
      phone: phone.trim(),
      student_id: studentId,
      email,
    });
    if (notifyEnrolled) {
      await createParentNotification(
        parentId,
        "Your child has been enrolled successfully.",
      );
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[POST /api/admin/parents/register]", e);
    return NextResponse.json(
      { error: "Could not register parent profile" },
      { status: 500 },
    );
  }
}
