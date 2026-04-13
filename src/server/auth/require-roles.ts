import { NextRequest, NextResponse } from "next/server";
import { ensureSeedAdmin } from "@/server/auth/auth-users-store";
import { getAdminSessionToken } from "@/server/auth/http-auth";
import { verifyJwt, type JwtPayload } from "@/server/auth/jwt";
import type { Role } from "@/lib/roles";

async function ensureBootstrap() {
  await ensureSeedAdmin();
}

export type RolesAuthResult =
  | { ok: true; payload: JwtPayload }
  | { ok: false; response: NextResponse };

export async function requireRolesApi(
  req: NextRequest,
  allowed: readonly Role[],
): Promise<RolesAuthResult> {
  await ensureBootstrap();
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
