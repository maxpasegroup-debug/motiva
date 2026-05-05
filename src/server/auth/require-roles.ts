import { NextRequest, NextResponse } from "next/server";
import type { Role } from "@/lib/roles";
import { getAdminSessionToken } from "@/server/auth/http-auth";
import { verifyJwt, type JwtPayload } from "@/server/auth/jwt";

export type RolesAuthResult =
  | { ok: true; payload: JwtPayload }
  | { ok: false; response: NextResponse };

export async function requireRolesApi(
  req: NextRequest,
  allowed: readonly Role[],
): Promise<RolesAuthResult> {
  const token = getAdminSessionToken(req);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const payload = verifyJwt(token);
    if (!allowed.includes(payload.role)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
    return { ok: true, payload };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}
