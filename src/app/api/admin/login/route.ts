import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import {
  adminJwtClaims,
  ensureSeedAdminDb,
  findAdminByLogin,
  isDatabaseConfigured,
  toPublicAdmin,
} from "@/server/auth/admins-store";
import { ADMIN_AUTH_COOKIE_NAME } from "@/server/auth/http-auth";
import { signJwt } from "@/server/auth/jwt";

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Admin database is not configured (DATABASE_URL)" },
      { status: 503 },
    );
  }

  const body = (await req.json()) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid login details" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const loginRaw =
    typeof o.login === "string"
      ? o.login
      : typeof o.email === "string"
        ? o.email
        : "";
  const password = typeof o.password === "string" ? o.password : "";

  if (!loginRaw || !password) {
    return NextResponse.json(
      { error: "Invalid login details" },
      { status: 401 },
    );
  }

  await ensureSeedAdminDb();

  const admin = await findAdminByLogin(loginRaw);
  if (!admin) {
    return NextResponse.json(
      { error: "Invalid login details" },
      { status: 401 },
    );
  }

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid login details" },
      { status: 401 },
    );
  }

  const claims = adminJwtClaims(admin);
  const token = signJwt(claims);

  const res = NextResponse.json({
    token,
    admin: toPublicAdmin(admin),
  });

  res.cookies.set(ADMIN_AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
