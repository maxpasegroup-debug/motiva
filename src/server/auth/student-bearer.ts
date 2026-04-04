import { NextRequest } from "next/server";
import { verifyJwt } from "@/server/auth/jwt";

export function getBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  return parts[1] || null;
}

/** Resolves logged-in student id from JWT, or null. */
export function parseStudentIdFromRequest(req: NextRequest): string | null {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const p = verifyJwt(token);
    if (p.role !== "student") return null;
    return p.sub;
  } catch {
    return null;
  }
}
