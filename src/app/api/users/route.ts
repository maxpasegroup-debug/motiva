import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isRole, type Role } from "@/lib/roles";
import { requireAdminApi } from "@/server/auth/require-admin";

const LISTABLE_ROLES: readonly Role[] = [
  "teacher",
  "student",
  "parent",
  "telecounselor",
  "demo_executive",
  "mentor",
];

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const roleQuery = req.nextUrl.searchParams.get("role");
  if (!isRole(roleQuery) || !LISTABLE_ROLES.includes(roleQuery)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { role: roleQuery },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      mobile: true,
      role: true,
      isActive: true,
      pinResetRequired: true,
    },
  });

  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      phone: user.mobile,
    })),
  });
}

export const dynamic = "force-dynamic";
