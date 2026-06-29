import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isRole } from "@/lib/roles";
import { requireAdminApi } from "@/server/auth/require-admin";
import { hashPin, isFourDigitPin, normalizeMobile } from "@/server/auth/unified-auth";

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
    pin?: string;
    passwordHash?: null;
    pinResetRequired?: boolean;
    profileData?: Prisma.InputJsonValue;
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
    if (id === auth.payload.userId && body.isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 400 },
      );
    }
    data.isActive = body.isActive;
  }

  if (typeof body.pin === "string" && body.pin.trim()) {
    const pin = body.pin.trim();
    if (!isFourDigitPin(pin)) {
      return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 });
    }
    data.pin = await hashPin(pin);
    data.passwordHash = null;
    data.pinResetRequired = false;

    const currentProfile = await prisma.user.findUnique({
      where: { id },
      select: { profileData: true },
    });
    const profile =
      currentProfile?.profileData &&
      typeof currentProfile.profileData === "object" &&
      !Array.isArray(currentProfile.profileData)
        ? (currentProfile.profileData as Record<string, unknown>)
        : {};
    data.profileData = { ...profile, visiblePin: pin };
  }

  if (data.mobile || data.role) {
    const current = await prisma.user.findUnique({
      where: { id },
      select: { mobile: true, role: true },
    });
    if (!current) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const nextMobile = data.mobile ?? current.mobile;
    const nextRole = data.role ?? current.role;
    if (nextMobile) {
      const duplicate = await prisma.user.findFirst({
        where: {
          id: { not: id },
          mobile: nextMobile,
          role: nextRole,
        },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Another user already has this mobile and role" },
          { status: 409 },
        );
      }
    }
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
      profileData: true,
    },
  });

  const profile =
    user.profileData && typeof user.profileData === "object" && !Array.isArray(user.profileData)
      ? (user.profileData as Record<string, unknown>)
      : {};

  return NextResponse.json({
    user: {
      ...user,
      visiblePin: typeof profile.visiblePin === "string" ? profile.visiblePin : null,
    },
  });
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
