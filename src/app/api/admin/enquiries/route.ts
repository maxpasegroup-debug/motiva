import { NextRequest, NextResponse } from "next/server";
import { appendLeadNote } from "@/lib/leads";
import prisma from "@/lib/prisma";
import { requireAdminApi } from "@/server/auth/require-admin";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
  });
  const leads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      demos: {
        orderBy: { createdAt: "desc" },
      },
      admissions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return NextResponse.json({ enquiries, leads });
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

  const payload = body as Record<string, unknown>;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const type =
    payload.type === "remedial" || payload.type === "foundation"
      ? payload.type
      : "tuition";
  const subjects =
    typeof payload.subjects === "string" && payload.subjects.trim()
      ? payload.subjects.trim()
      : null;
  const assignedTo =
    typeof payload.assignedTo === "string" && payload.assignedTo.trim()
      ? payload.assignedTo.trim()
      : null;
  const note =
    typeof payload.note === "string" && payload.note.trim()
      ? payload.note.trim()
      : "Lead created manually from admin panel.";

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Name and phone are required" },
      { status: 400 },
    );
  }

  try {
    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        type,
        subjects,
        assignedTo,
        flowType: type === "remedial" ? "remedial" : "tuition",
        notes: appendLeadNote(null, {
          text: note,
          addedBy: auth.payload.name || auth.payload.role,
        }),
      },
      include: {
        demos: true,
        admissions: true,
      },
    });

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/enquiries]", error);
    return NextResponse.json(
      { error: "Could not create lead" },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";
