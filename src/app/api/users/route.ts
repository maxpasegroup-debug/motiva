import { NextRequest, NextResponse } from "next/server";
import { readAuthUsers, toPublicUser } from "@/server/auth/auth-users-store";
import { requireAdminApi } from "@/server/auth/require-admin";
import type { Role } from "@/lib/roles";

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
  const role = roleQuery as Role | null;
  if (!role || !LISTABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const users = await readAuthUsers();
  const out = users.filter((u) => u.role === role).map(toPublicUser);
  return NextResponse.json({ users: out });
}
