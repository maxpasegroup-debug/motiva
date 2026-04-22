import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  appendLeadNote,
  isAllowedLeadStatusTransition,
  normalizeLeadStatus,
} from "@/lib/leads";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor"] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireRolesApi(req, ROLES);
  if (!auth.ok) return auth.response;

  const id = params.id?.trim() ?? "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
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
  const status =
    typeof payload.status === "string" && payload.status.trim()
      ? normalizeLeadStatus(payload.status)
      : null;
  const note =
    typeof payload.note === "string" && payload.note.trim()
      ? payload.note.trim()
      : null;
  const addedBy =
    typeof payload.addedBy === "string" && payload.addedBy.trim()
      ? payload.addedBy.trim()
      : auth.payload.name || auth.payload.role;

  if (!status && !note) {
    return NextResponse.json(
      { error: "status or note is required" },
      { status: 400 },
    );
  }

  try {
    const existing = await prisma.lead.findUnique({
      where: { id },
      include: {
        demos: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (status && !isAllowedLeadStatusTransition(existing.status, status)) {
      return NextResponse.json(
        { error: "Invalid status transition" },
        { status: 400 },
      );
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        status: status ?? existing.status,
        notes: note
          ? appendLeadNote(existing.notes, {
              text: note,
              addedBy,
            })
          : existing.notes,
      },
      include: {
        demos: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error("[PUT /api/admin/leads/[id]/status]", error);
    return NextResponse.json(
      { error: "Could not update lead" },
      { status: 500 },
    );
  }
}
