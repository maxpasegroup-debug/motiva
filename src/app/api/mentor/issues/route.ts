import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function issueWhere(mentorId: string, status?: string) {
  return {
    OR: [
      { assignedToId: mentorId },
      { assignedTo: mentorId },
      { raisedById: mentorId },
      { reportedBy: mentorId },
    ],
    ...(status && status !== "all" ? { status } : {}),
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireRolesApi(req, ["mentor", "admin"]);
  if (!auth.ok) return auth.response;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const issues = await prisma.issue.findMany({
    where: issueWhere(auth.payload.sub, status),
    include: {
      student: {
        select: {
          id: true,
          studentName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ issues });
}

export async function POST(req: NextRequest) {
  const auth = await requireRolesApi(req, ["mentor", "admin"]);
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
  const studentId = typeof payload.studentId === "string" ? payload.studentId.trim() : "";
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const category = typeof payload.category === "string" ? payload.category.trim() : "other";
  const priority = typeof payload.priority === "string" ? payload.priority.trim() : "medium";
  const description =
    typeof payload.description === "string" ? payload.description.trim() : "";
  const assignedToId =
    typeof payload.assignedToId === "string" ? payload.assignedToId.trim() : auth.payload.sub;

  if (!studentId || !title) {
    return NextResponse.json({ error: "Student and title are required" }, { status: 400 });
  }

  const student = await prisma.studentAccount.findFirst({
    where: {
      id: studentId,
      mentorId: auth.payload.sub,
    },
    select: {
      id: true,
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const timeline = [
    {
      text: "Issue created",
      timestamp: new Date().toISOString(),
      addedBy: auth.payload.sub,
      status: "open",
    },
  ];

  const issue = await prisma.issue.create({
    data: {
      reportedBy: auth.payload.sub,
      assignedTo: assignedToId,
      studentId,
      raisedById: auth.payload.sub,
      assignedToId,
      entityType: "student",
      entityId: studentId,
      title,
      category,
      description,
      priority,
      status: "open",
      timeline,
    },
  });

  return NextResponse.json({ issue }, { status: 201 });
}
