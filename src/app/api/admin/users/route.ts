import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import {
  createUserAsAdmin,
  toPublicUser,
} from "@/server/auth/auth-users-store";
import { requireAdminApi } from "@/server/auth/require-admin";
import type { Role } from "@/lib/roles";

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;

  const name = typeof o.name === "string" ? o.name : "";
  const email = typeof o.email === "string" ? o.email : "";
  const password = typeof o.password === "string" ? o.password : "";
  const role = o.role as Role | undefined;

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  if (
    role !== "teacher" &&
    role !== "student" &&
    role !== "parent"
  ) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await createUserAsAdmin({ name, email, passwordHash, role });
  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: 400 });
  }

  return NextResponse.json({ user: toPublicUser(created.user) }, { status: 201 });
}

