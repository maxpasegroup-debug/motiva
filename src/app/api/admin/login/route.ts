import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  comparePin,
  issueAuthToken,
  normalizeMobile,
  setAuthCookie,
} from "@/server/auth/unified-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function invalidLogin() {
  return NextResponse.json({ error: "Invalid admin login" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const login = typeof body.login === "string"
    ? body.login.trim()
    : typeof body.email === "string"
      ? body.email.trim()
      : typeof body.mobile === "string"
        ? body.mobile.trim()
        : "";
  const password = typeof body.password === "string"
    ? body.password
    : typeof body.pin === "string"
      ? body.pin
      : "";

  if (!login || !password) {
    return NextResponse.json({ error: "Login and password are required" }, { status: 400 });
  }

  const mobile = normalizeMobile(login);
  if (/^\d{10}$/.test(mobile)) {
    const users = await prisma.user.findMany({
      where: { mobile, role: "admin", isActive: true },
      orderBy: { createdAt: "asc" },
    });
    for (const user of users) {
      if (await comparePin(password, user.pin)) {
        const token = issueAuthToken(user);
        const response = NextResponse.json({
          success: true,
          token,
          role: user.role,
          admin: { id: user.id, role: user.role, name: user.name, mobile: user.mobile },
        });
        setAuthCookie(response, token);
        return response;
      }
    }
    return invalidLogin();
  }

  const email = login.toLowerCase();
  const legacyAdmin = await prisma.admin.findUnique({ where: { email } });
  if (!legacyAdmin || !(await bcrypt.compare(password, legacyAdmin.passwordHash))) {
    return invalidLogin();
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin",
      role: "admin",
      isActive: true,
      passwordHash: legacyAdmin.passwordHash,
    },
    create: {
      name: "Admin",
      email,
      username: email,
      passwordHash: legacyAdmin.passwordHash,
      role: "admin",
      isActive: true,
      createdBy: "legacy-admin-login",
    },
  });

  const token = issueAuthToken(user);
  const response = NextResponse.json({
    success: true,
    token,
    role: user.role,
    admin: { id: user.id, role: user.role, name: user.name, email: user.email },
  });
  setAuthCookie(response, token);
  return response;
}

export function GET(req: NextRequest) {
  return NextResponse.redirect(new URL("/api/auth/login", req.url), 301);
}
