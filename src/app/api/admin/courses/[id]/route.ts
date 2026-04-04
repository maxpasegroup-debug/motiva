import { NextRequest, NextResponse } from "next/server";
import {
  deleteCourseById,
  getCourseWithLessons,
  updateCourse,
} from "@/server/courses/courses-db";
import { getDatabaseUrl } from "@/server/db/pool";
import { requireAdminApi } from "@/server/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const row = await getCourseWithLessons(params.id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  void req;
  return NextResponse.json({
    course: {
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail_path: row.thumbnail_path,
      is_published: row.is_published,
    },
    lessons: row.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      video_url: l.video_url,
      sort_order: l.sort_order,
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
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

  const patch: {
    title?: string;
    description?: string | null;
    thumbnail_path?: string | null;
    is_published?: boolean;
  } = {};

  if (typeof o.title === "string") patch.title = o.title;
  if (o.description === null || typeof o.description === "string") {
    patch.description = o.description as string | null;
  }
  if (o.thumbnail_path === null || typeof o.thumbnail_path === "string") {
    patch.thumbnail_path = o.thumbnail_path as string | null;
  }
  if (typeof o.is_published === "boolean") {
    patch.is_published = o.is_published;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const ok = await updateCourse(params.id, patch);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  void req;

  const ok = await deleteCourseById(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
