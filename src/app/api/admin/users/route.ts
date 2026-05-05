import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isRole, type Role } from "@/lib/roles";
import { requireAdminApi } from "@/server/auth/require-admin";
import { hashPin, isFourDigitPin, normalizeMobile } from "@/server/auth/unified-auth";

const CREATABLE_ROLES: Role[] = [
  "admin",
  "telecounselor",
  "demo_executive",
  "mentor",
  "teacher",
  "student",
  "parent",
  "public",
];

function publicUser(user: {
  id: string;
  name: string;
  mobile: string | null;
  role: string;
  isActive: boolean;
  pinResetRequired: boolean;
  profileData: unknown;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    mobile: user.mobile,
    phone: user.mobile,
    role: user.role,
    isActive: user.isActive,
    pinResetRequired: user.pinResetRequired,
    profileData: user.profileData,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const role = req.nextUrl.searchParams.get("role");
  const where = role && isRole(role) ? { role } : undefined;

  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      mobile: true,
      role: true,
      isActive: true,
      pinResetRequired: true,
      profileData: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users: users.map(publicUser) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const mobile = normalizeMobile(typeof body.mobile === "string" ? body.mobile : "");
  const pin = typeof body.pin === "string" ? body.pin : "";
  const roleValue = body.role;

  if (name.length < 2 || !mobile || !isFourDigitPin(pin) || !isRole(roleValue)) {
    return NextResponse.json(
      { error: "Name, 10-digit mobile, 4-digit PIN, and valid role are required" },
      { status: 400 },
    );
  }

  if (!CREATABLE_ROLES.includes(roleValue)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: { mobile, role: roleValue },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this mobile and role already exists" },
      { status: 409 },
    );
  }

  const pinHash = await hashPin(pin);
  const user = await prisma.user.create({
    data: {
      name,
      mobile,
      pin: pinHash,
      role: roleValue,
      isActive: true,
      pinResetRequired: false,
      createdBy: auth.payload.userId,
    },
    select: {
      id: true,
      name: true,
      mobile: true,
      role: true,
      isActive: true,
      pinResetRequired: true,
      profileData: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}

export const dynamic = "force-dynamic";
