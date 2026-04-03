import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import {
  createUserAsAdmin,
  ensureSeedAdmin,
  toPublicUser,
} from "@/server/auth/auth-users-store";
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

export async function POST(req: NextRequest) {
  await ensureSeedAdmin();

  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = verifyJwt(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

