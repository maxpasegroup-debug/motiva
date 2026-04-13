import type { NextRequest } from "next/server";
import { verifyJwt } from "@/server/auth/jwt";
import { getBearerToken } from "@/server/auth/student-bearer";

export function parseParentIdFromRequest(req: NextRequest): string | null {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const p = verifyJwt(token);
    if (p.role !== "parent") return null;
    return p.sub;
  } catch {
    return null;
  }
}
