import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { todayDateOnly } from "@/lib/portal";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getStudentAccountId(userId: string) {
  const student = await prisma.studentAccount.findUnique({
    where: { userId },
    select: { id: true },
  });
  return student?.id ?? null;
}

export async function GET(req: NextRequest) {
  const auth = await requireRolesApi(req, ["student"]);
  if (!auth.ok) return auth.response;

  const studentId = await getStudentAccountId(auth.payload.sub);
  if (!studentId) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
  }

  const record = await prisma.studentWellbeing.findUnique({
    where: {
      studentId_date: {
        studentId,
        date: todayDateOnly(),
      },
    },
  });

  return NextResponse.json({ record });
}

export async function POST(req: NextRequest) {
  const auth = await requireRolesApi(req, ["student"]);
  if (!auth.ok) return auth.response;

  const studentId = await getStudentAccountId(auth.payload.sub);
  if (!studentId) {
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
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

  const payload = body as Record<string, unknown>;
  const rating = typeof payload.rating === "number" ? payload.rating : Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const date = todayDateOnly();
  const existing = await prisma.studentWellbeing.findUnique({
    where: {
      studentId_date: {
        studentId,
        date,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ record: existing });
  }

  const record = await prisma.studentWellbeing.create({
    data: {
      studentId,
      rating,
      date,
    },
  });

  return NextResponse.json({ record }, { status: 201 });
}
