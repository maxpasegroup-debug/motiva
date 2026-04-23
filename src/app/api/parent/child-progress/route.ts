import { NextRequest, NextResponse } from "next/server";
import { requireRolesApi } from "@/server/auth/require-roles";
import { getParentChildProgress } from "@/server/parent/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRolesApi(req, ["parent"]);
  if (!auth.ok) return auth.response;

  const snapshot = await getParentChildProgress(auth.payload.sub);
  if (!snapshot) {
    return NextResponse.json({ error: "Parent not found" }, { status: 404 });
  }

  return NextResponse.json({
    attendance: snapshot.attendance,
    mood: snapshot.mood,
    schedule: snapshot.schedule,
    weekly: snapshot.weekly,
  });
}
