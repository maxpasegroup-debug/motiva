import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRolesApi } from "@/server/auth/require-roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROLES = ["admin", "telecounselor"] as const;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireRolesApi(req, ROLES);
  if (!auth.ok) return auth.response;

  const id = params.id?.trim() ?? "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        demos: {
          orderBy: { createdAt: "desc" },
        },
        admissions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("[GET /api/admin/leads/[id]]", error);
    return NextResponse.json(
      { error: "Could not load lead" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
  const name = typeof payload.name === "string" ? payload.name.trim() : undefined;
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : undefined;
  const subjects =
    typeof payload.subjects === "string" ? payload.subjects.trim() || null : undefined;
  const assignedTo =
    typeof payload.assignedTo === "string"
      ? payload.assignedTo.trim() || null
      : undefined;
  const type =
    payload.type === "foundation" || payload.type === "tuition" || payload.type === "remedial"
      ? payload.type
      : undefined;

  if (name !== undefined && name.length < 2) {
    return NextResponse.json({ error: "Name is too short" }, { status: 400 });
  }
  if (phone !== undefined && phone.length < 6) {
    return NextResponse.json({ error: "Phone is too short" }, { status: 400 });
  }

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(subjects !== undefined ? { subjects } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
        ...(type !== undefined
          ? { type, flowType: type === "remedial" ? "remedial" : "tuition" }
          : {}),
      },
      include: {
        demos: { orderBy: { createdAt: "desc" } },
        admissions: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("[PATCH /api/admin/leads/[id]]", error);
    return NextResponse.json(
      { error: "Could not update lead" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireRolesApi(req, ROLES);
  if (!auth.ok) return auth.response;

  const id = params.id?.trim() ?? "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const [admissions, payments] = await Promise.all([
      prisma.admission.count({ where: { leadId: id } }),
      prisma.paymentTransaction.count({ where: { leadId: id } }),
    ]);
    if (admissions > 0 || payments > 0) {
      return NextResponse.json(
        {
          error:
            "This lead already has admission or fee records. Move it to Lost instead of deleting.",
        },
        { status: 400 },
      );
    }

    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/leads/[id]]", error);
    return NextResponse.json(
      { error: "Could not delete lead" },
      { status: 500 },
    );
  }
}
