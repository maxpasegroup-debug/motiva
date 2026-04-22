import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/server/auth/require-admin";

function intOr(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return fallback;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const teachers = await prisma.teacher.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ teachers });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
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

  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const subject = typeof o.subject === "string" ? o.subject.trim() : "";
  const bio = typeof o.bio === "string" ? o.bio.trim() : null;
  const photo = typeof o.photo === "string" ? o.photo.trim() : null;
  const displayOrder = intOr(o.displayOrder, 0);
  const isVisible = typeof o.isVisible === "boolean" ? o.isVisible : true;

  if (!name || !subject) {
    return NextResponse.json(
      { error: "name and subject are required" },
      { status: 400 },
    );
  }

  const teacher = await prisma.teacher.create({
    data: {
      name,
      subject,
      bio: bio || null,
      photo: photo || null,
      displayOrder,
      isVisible,
    },
  });

  return NextResponse.json({ teacher }, { status: 201 });
}
