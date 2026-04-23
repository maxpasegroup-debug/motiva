import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/server/auth/require-admin";

type Ctx = { params: { id: string } };

function intOr(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return fallback;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const teacher = await prisma.teacher.findUnique({ where: { id: params.id } });
  if (!teacher) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ teacher });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const existing = await prisma.teacher.findUnique({ where: { id: params.id } });
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

  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : existing.name;
  const subject =
    typeof o.subject === "string" ? o.subject.trim() : existing.subject;
  const bio = typeof o.bio === "string" ? o.bio.trim() : existing.bio;
  const photo = typeof o.photo === "string" ? o.photo.trim() : existing.photo;
  const displayOrder =
    o.displayOrder !== undefined
      ? intOr(o.displayOrder, existing.displayOrder)
      : existing.displayOrder;
  const isVisible =
    typeof o.isVisible === "boolean" ? o.isVisible : existing.isVisible;

  if (!name || !subject) {
    return NextResponse.json(
      { error: "name and subject are required" },
      { status: 400 },
    );
  }

  const teacher = await prisma.teacher.update({
    where: { id: params.id },
    data: {
      name,
      subject,
      bio: bio || null,
      photo: photo || null,
      displayOrder,
      isVisible,
    },
  });

  return NextResponse.json({ teacher });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const existing = await prisma.teacher.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.teacher.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
export const dynamic = "force-dynamic";
