import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isRole } from "@/lib/roles";
import { requireAdminApi } from "@/server/auth/require-admin";
import { normalizeMobile } from "@/server/auth/unified-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const data: {
    name?: string;
    mobile?: string;
    role?: string;
    isActive?: boolean;
  } = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (name.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    }
    data.name = name;
  }

  if (typeof body.mobile === "string") {
    const mobile = normalizeMobile(body.mobile);
    if (!mobile) {
      return NextResponse.json({ error: "Mobile must be 10 digits" }, { status: 400 });
    }
    data.mobile = mobile;
  }

  if (body.role !== undefined) {
    if (!isRole(body.role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    data.role = body.role;
  }

  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      mobile: true,
      role: true,
      isActive: true,
      pinResetRequired: true,
    },
  });

  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (id === auth.payload.userId) {
    return NextResponse.json(
      { error: "You cannot deactivate your own admin account" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
