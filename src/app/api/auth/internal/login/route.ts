import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getJwtSecret } from "@/lib/jwt-env";
import prisma from "@/lib/prisma";
import { captureException } from "@/lib/sentry";

const AUTH_COOKIE = "motiva_user_auth";
const INTERNAL_ROLES = new Set([
  "admin",
  "mentor",
  "teacher",
  "telecounselor",
  "demo_executive",
  "parent",
  "student",
]);

const internalLoginSchema = z.object({
  username: z.string().trim().min(3).max(64),
  pin: z.string().regex(/^\d{4}$/),
});

function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const parsed = internalLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { username, pin } = parsed.data;

    const user = await prisma.user.findFirst({
      where: { username },
    });

    if (user && user.pin && INTERNAL_ROLES.has(user.role)) {
      const ok = await bcrypt.compare(pin, user.pin);
      if (!ok) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 },
        );
      }

      const token = jwt.sign(
        {
          sub: user.id,
          userId: user.id,
          username: user.username ?? username,
          role: user.role,
          email: user.email,
          name: user.name,
          tokenType: "internal",
        },
        getJwtSecret(),
        { expiresIn: "7d" },
      );

      const response = NextResponse.json({
        success: true,
        requiresPinReset: user.pinResetRequired,
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
        },
      });
      setAuthCookie(response, token);
      return response;
    }

    const studentAccount = await prisma.studentAccount.findUnique({
      where: { username },
    });

    if (studentAccount) {
      const ok = await bcrypt.compare(pin, studentAccount.pin);
      if (!ok) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 },
        );
      }

      const token = jwt.sign(
        {
          sub: studentAccount.id,
          userId: studentAccount.id,
          username: studentAccount.username,
          role: "student",
          email: studentAccount.email ?? "",
          name: studentAccount.studentName,
          tokenType: "internal",
        },
        getJwtSecret(),
        { expiresIn: "7d" },
      );

      const response = NextResponse.json({
        success: true,
        requiresPinReset: studentAccount.pinResetRequired,
        token,
        user: {
          id: studentAccount.id,
          username: studentAccount.username,
          role: "student",
          name: studentAccount.studentName,
        },
      });
      setAuthCookie(response, token);
      return response;
    }

    const parentAccount = await prisma.parentAccount.findUnique({
      where: { username },
    });
    if (!parentAccount) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(pin, parentAccount.pin);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      {
        sub: parentAccount.id,
        userId: parentAccount.id,
        username: parentAccount.username,
        role: "parent",
        email: "",
        name: parentAccount.name,
        tokenType: "internal",
      },
      getJwtSecret(),
      { expiresIn: "7d" },
    );

    const response = NextResponse.json({
      success: true,
      requiresPinReset: false,
      token,
      user: {
        id: parentAccount.id,
        username: parentAccount.username,
        role: "parent",
        name: parentAccount.name,
      },
    });
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    captureException(error, { route: "/api/auth/internal/login" });
    return NextResponse.json(
      { error: "Could not complete login" },
      { status: 500 },
    );
  }
}
