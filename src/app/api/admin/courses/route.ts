import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  COURSE_STATUSES,
  isTargetRole,
} from "@/lib/recorded-courses";
import { requireAdminApi } from "@/server/auth/require-admin";

function parseNumber(v: unknown, fallback: number) {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const courses = await prisma.course.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { sections: true, enrollments: true } } },
  });

  return NextResponse.json({ courses });
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

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const thumbnail = typeof b.thumbnail === "string" ? b.thumbnail.trim() : "";
  const description =
    typeof b.description === "string" ? b.description : "";
  const targetRole =
    typeof b.targetRole === "string" ? b.targetRole.trim() : "";
  const status =
    typeof b.status === "string" ? b.status.trim() : "draft";
  const price = parseNumber(b.price, 0);

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

  const course = await prisma.course.create({
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
export const dynamic = "force-dynamic";
