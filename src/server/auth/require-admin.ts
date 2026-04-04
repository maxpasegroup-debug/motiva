import { NextRequest, NextResponse } from "next/server";
import { ensureSeedAdminDb, isDatabaseConfigured } from "@/server/auth/admins-store";
import { ensureSeedAdmin } from "@/server/auth/auth-users-store";
import { getAdminSessionToken } from "@/server/auth/http-auth";
import { verifyJwt, type JwtPayload } from "@/server/auth/jwt";

async function ensureBootstrap() {
  await ensureSeedAdmin();
  if (isDatabaseConfigured()) {
    await ensureSeedAdminDb();
  }
}

export type AdminAuthResult =
  | { ok: true; payload: JwtPayload }
  | { ok: false; response: NextResponse };

export async function requireAdminApi(req: NextRequest): Promise<AdminAuthResult> {
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
    if (payload.role !== "admin") {
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
