import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import {
  ensureSeedAdmin,
  findAuthUserByEmail,
  toPublicUser,
} from "@/server/auth/auth-users-store";
import { signJwt } from "@/server/auth/jwt";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid login details" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const email = typeof o.email === "string" ? o.email : "";
  const password = typeof o.password === "string" ? o.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Invalid login details" },
      { status: 401 },
    );
  }

  await ensureSeedAdmin();

  const user = await findAuthUserByEmail(email);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid login details" },
      { status: 401 },
    );
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid login details" },
      { status: 401 },
    );
  }

  const token = signJwt(user);
  // Keep response small; role-based redirects happen on the client.
  return NextResponse.json({ token, user: toPublicUser(user) });
}

