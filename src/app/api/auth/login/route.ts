import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import {
  ensureSeedAdminDb,
  isDatabaseConfigured,
} from "@/server/auth/admins-store";
import {
  ensureSeedAdmin,
  findAuthUserByEmail,
  findAuthUserById,
  findAuthUserByPhoneDigits,
  toPublicUser,
} from "@/server/auth/auth-users-store";
import { ADMIN_AUTH_COOKIE_NAME } from "@/server/auth/http-auth";
import { signJwt } from "@/server/auth/jwt";
import { getDatabaseUrl } from "@/server/db/pool";
import {
  findParentIdByContactEmail,
  findParentIdByPhoneDigits,
  normalizePhoneDigits,
} from "@/server/parents/parents-portal-db";

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

async function resolveAuthUserForPortalLogin(loginRaw: string) {
  const login = loginRaw.trim();
  if (!login) return null;

  if (login.includes("@")) {
    const e = normalizeEmail(login);
    let user = await findAuthUserByEmail(e);
    if (user) return user;
    if (getDatabaseUrl()) {
      const parentId = await findParentIdByContactEmail(e);
      if (parentId) {
        user = await findAuthUserById(parentId);
        if (user && user.role === "parent") return user;
      }
    }
    return null;
  }

  const digits = normalizePhoneDigits(login);
  if (!digits || !getDatabaseUrl()) return null;
  const parentId = await findParentIdByPhoneDigits(digits);
  if (!parentId) return null;
  const user = await findAuthUserById(parentId);
  if (user && user.role === "parent") return user;
  return null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid login details" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const loginField =
    typeof o.login === "string"
      ? o.login
      : typeof o.email === "string"
        ? o.email
        : "";
  const password = typeof o.password === "string" ? o.password : "";

  if (!loginField || !password) {
    return NextResponse.json(
      { error: "Invalid login details" },
      { status: 401 },
    );
  }

  await ensureSeedAdmin();
  if (isDatabaseConfigured()) {
    await ensureSeedAdminDb();
  }

  let user = await findAuthUserByEmail(normalizeEmail(loginField));
  if (!user && !loginField.includes("@")) {
    const digits = normalizePhoneDigits(loginField);
    if (digits) {
      user = await findAuthUserByPhoneDigits(digits);
    }
  }
  if (!user) {
    user = await resolveAuthUserForPortalLogin(loginField);
  }
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
  const res = NextResponse.json({ token, user: toPublicUser(user) });
  if (user.role === "admin") {
    res.cookies.set(ADMIN_AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return res;
}

