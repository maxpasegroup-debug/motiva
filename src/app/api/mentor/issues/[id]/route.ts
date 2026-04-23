import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseIssueTimeline } from "@/lib/mentor";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function findIssueForMentor(issueId: string, mentorId: string) {
  return prisma.issue.findFirst({
    where: {
      id: issueId,
      OR: [
        { assignedToId: mentorId },
        { assignedTo: mentorId },
        { raisedById: mentorId },
        { reportedBy: mentorId },
      ],
    },
    include: {
      student: {
        select: {
          id: true,
          studentName: true,
        },
      },
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireRolesApi(req, ["mentor", "admin"]);
  if (!auth.ok) return auth.response;

  const issue = await findIssueForMentor(params.id, auth.payload.sub);
  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json({ issue });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireRolesApi(req, ["mentor", "admin"]);
  if (!auth.ok) return auth.response;

  const issue = await findIssueForMentor(params.id, auth.payload.sub);
  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
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
  const nextStatus =
    typeof payload.status === "string" && payload.status.trim()
      ? payload.status.trim()
      : undefined;
  const note = typeof payload.note === "string" ? payload.note.trim() : "";

  if (!nextStatus && !note) {
    return NextResponse.json({ error: "Add a note or change the status" }, { status: 400 });
  }

  const timeline = parseIssueTimeline(issue.timeline);
  const now = new Date().toISOString();

  if (nextStatus) {
    timeline.push({
      text: `Status changed to ${nextStatus.replace(/_/g, " ")}`,
      timestamp: now,
      addedBy: auth.payload.sub,
      status: nextStatus,
    });
  }

  if (note) {
    timeline.push({
      text: note,
      timestamp: now,
      addedBy: auth.payload.sub,
      status: nextStatus ?? issue.status,
    });
  }

  const updatedIssue = await prisma.issue.update({
    where: {
      id: issue.id,
    },
    data: {
      status: nextStatus ?? issue.status,
      timeline,
    },
  });

  return NextResponse.json({ issue: updatedIssue });
}
