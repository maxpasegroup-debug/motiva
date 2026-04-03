import { NextRequest, NextResponse } from "next/server";
import { readAuthUsers, toPublicUser } from "@/server/auth/auth-users-store";
import { verifyJwt } from "@/server/auth/jwt";
import type { Role } from "@/lib/roles";

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length !== 2) return null;
  if (parts[0] !== "Bearer") return null;
  return parts[1];
}

export async function GET(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    verifyJwt(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const roleQuery = req.nextUrl.searchParams.get("role");
  const role = roleQuery as Role | null;
  if (!role || (role !== "teacher" && role !== "student")) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const users = await readAuthUsers();
  const out = users.filter((u) => u.role === role).map(toPublicUser);
  return NextResponse.json({ users: out });
}

