import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  COURSE_STATUSES,
  isTargetRole,
} from "@/lib/recorded-courses";
import { requireAdminApi } from "@/server/auth/require-admin";

type Ctx = { params: { id: string } };

function parseNumber(v: unknown, fallback: number) {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

export async function GET(req: NextRequest, context: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const { id } = context.params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: {
          videos: { orderBy: { order: "asc" } },
        },
      },
    },
  });
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ course });
}

export async function PUT(req: NextRequest, context: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const { id } = context.params;

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : existing.title;
  const thumbnail =
    typeof b.thumbnail === "string" ? b.thumbnail.trim() : existing.thumbnail;
  const description =
    typeof b.description === "string" ? b.description : existing.description;
  const targetRole =
    typeof b.targetRole === "string" ? b.targetRole.trim() : existing.targetRole;
  const status =
    typeof b.status === "string" ? b.status.trim() : existing.status;
  const price =
    b.price !== undefined ? parseNumber(b.price, existing.price) : existing.price;

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!thumbnail) {
    return NextResponse.json(
      { error: "thumbnail is required" },
      { status: 400 },
    );
  }
  if (!isTargetRole(targetRole)) {
    return NextResponse.json(
      { error: "targetRole is invalid" },
      { status: 400 },
    );
  }
  if (!(COURSE_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: "status must be draft or published" },
      { status: 400 },
    );
  }
  if (price < 0) {
    return NextResponse.json({ error: "price must be >= 0" }, { status: 400 });
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      title,
      thumbnail,
      description,
      targetRole,
      price,
      status,
    },
  });
  return NextResponse.json({ course });
}

export async function DELETE(req: NextRequest, context: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const { id } = context.params;

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
export const dynamic = "force-dynamic";
