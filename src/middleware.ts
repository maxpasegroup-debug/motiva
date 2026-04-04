import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRoleHome, type Role } from "@/lib/roles";
import {
  ADMIN_AUTH_COOKIE_NAME,
  getBearerToken,
} from "@/server/auth/http-auth";
import { verifyJwtEdge } from "@/server/auth/jwt-edge";

function getAdminToken(req: NextRequest): string | null {
  const bearer = getBearerToken(req);
  if (bearer) return bearer;
  return req.cookies.get(ADMIN_AUTH_COOKIE_NAME)?.value ?? null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  const token = getAdminToken(request);
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await verifyJwtEdge(token);
    if (payload.role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const home = getRoleHome(payload.role as Role);
      return NextResponse.redirect(new URL(home, request.url));
    }
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
