import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { AUTH_COOKIE_NAME } from "@/server/auth/http-auth";
import { signJwt } from "@/server/auth/jwt";

export function normalizeMobile(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function isFourDigitPin(value: string): boolean {
  return /^\d{4}$/.test(value);
}

export function publicUserPayload(user: User) {
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    mobile: user.mobile,
    profileData: user.profileData,
  };
}

export function issueAuthToken(user: User): string {
  return signJwt(publicUserPayload(user));
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function comparePin(pin: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(pin, hash);
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}
