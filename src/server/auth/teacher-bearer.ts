import { NextRequest } from "next/server";
import { getBearerToken } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";

export function parseTeacherIdFromRequest(req: NextRequest): string | null {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const p = verifyJwt(token);
    if (p.role !== "teacher") return null;
    return p.sub;
  } catch {
    return null;
  }
}
