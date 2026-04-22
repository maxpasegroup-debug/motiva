import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "motiva_admin_auth";
const USER_COOKIE = "motiva_user_auth";

export function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] ?? null;
}

/** Bearer first (API clients), then HttpOnly cookie (browser + middleware). */
export function getAdminSessionToken(req: NextRequest): string | null {
  const bearer = getBearerToken(req);
  if (bearer) return bearer;
  return (
    req.cookies.get(ADMIN_COOKIE)?.value ??
    req.cookies.get(USER_COOKIE)?.value ??
    null
  );
}

export const ADMIN_AUTH_COOKIE_NAME = ADMIN_COOKIE;
