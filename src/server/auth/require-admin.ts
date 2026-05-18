import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionToken } from "@/server/auth/http-auth";
import { verifyJwt, type JwtPayload } from "@/server/auth/jwt";
import type { Role } from "@/lib/roles";

export type AdminAuthResult =
  | { ok: true; payload: JwtPayload }
  | { ok: false; response: NextResponse };

const adminApiRoles: readonly Role[] = [
  "admin",
  "telecounselor",
  "demo_executive",
  "administrative_officer",
  "manager",
  "academic_coordinator",
  "hr",
  "mentor",
  "teacher",
];

export async function requireAdminApi(req: NextRequest): Promise<AdminAuthResult> {
  const token = getAdminSessionToken(req);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  try {
    const payload = verifyJwt(token);
    if (!adminApiRoles.includes(payload.role)) {
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
