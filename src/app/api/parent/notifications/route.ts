import { NextRequest, NextResponse } from "next/server";
import { requireRolesApi } from "@/server/auth/require-roles";
import {
  getParentPortalSnapshot,
  markAllParentNotifications,
  markParentNotifications,
} from "@/server/parent/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireRolesApi(req, ["parent"]);
  if (!auth.ok) return auth.response;

  const snapshot = await getParentPortalSnapshot(auth.payload.sub);
  if (!snapshot) {
    return NextResponse.json({ error: "Parent not found" }, { status: 404 });
  }

  return NextResponse.json({ notifications: snapshot.notifications });
}

export async function PUT(req: NextRequest) {
  const auth = await requireRolesApi(req, ["parent"]);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const markAllRead = payload.markAllRead === true;
  const notificationIds = Array.isArray(payload.notificationIds)
    ? payload.notificationIds.filter((id): id is string => typeof id === "string")
    : [];

  if (!markAllRead && notificationIds.length === 0) {
    return NextResponse.json(
      { error: "Provide notificationIds or markAllRead" },
      { status: 400 },
    );
  }

  if (markAllRead) {
    await markAllParentNotifications(auth.payload.sub);
  } else {
    await markParentNotifications(auth.payload.sub, notificationIds);
  }

  return NextResponse.json({ success: true });
}
