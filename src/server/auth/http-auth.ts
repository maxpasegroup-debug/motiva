import type { NextRequest } from "next/server";

export const AUTH_COOKIE_NAME = "motiva_auth";
export const ADMIN_AUTH_COOKIE_NAME = AUTH_COOKIE_NAME;

export function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] ?? null;
}

/** Bearer first for API clients, then the unified HttpOnly browser cookie. */
export function getSessionToken(req: NextRequest): string | null {
  const bearer = getBearerToken(req);
  if (bearer) return bearer;
  return req.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export function getAdminSessionToken(req: NextRequest): string | null {
  return getSessionToken(req);
}
