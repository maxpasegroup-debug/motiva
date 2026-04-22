import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRoleHome, type Role } from "@/lib/roles";
import {
  ADMIN_AUTH_COOKIE_NAME,
  getBearerToken,
} from "@/server/auth/http-auth";
import { verifyJwtEdge } from "@/server/auth/jwt-edge";

const USER_AUTH_COOKIE_NAME = "motiva_user_auth";

function getSessionToken(req: NextRequest): string | null {
  const bearer = getBearerToken(req);
  if (bearer) return bearer;
  return (
    req.cookies.get(ADMIN_AUTH_COOKIE_NAME)?.value ??
    req.cookies.get(USER_AUTH_COOKIE_NAME)?.value ??
    null
  );
}

type Guard = { prefix: string; roles: readonly Role[] };

const PAGE_GUARDS: Guard[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/mentor", roles: ["mentor"] },
  { prefix: "/teacher", roles: ["teacher"] },
  { prefix: "/student", roles: ["student"] },
  { prefix: "/parent", roles: ["parent"] },
  { prefix: "/leads", roles: ["admin", "telecounselor"] },
  { prefix: "/demo", roles: ["admin", "demo_executive"] },
];

function guardForPath(pathname: string): Guard | null {
  const sorted = [...PAGE_GUARDS].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  return (
    sorted.find(
      (g) => pathname === g.prefix || pathname.startsWith(`${g.prefix}/`),
    ) ?? null
  );
}

function isProtectedAdminApi(pathname: string): boolean {
  if (!pathname.startsWith("/api/admin")) return false;
  if (pathname === "/api/admin/login" || pathname === "/api/admin/logout") {
    return false;
  }
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const adminApi = isProtectedAdminApi(pathname);
  const pageGuard = guardForPath(pathname);
  const dashboardLegacy = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (!adminApi && !pageGuard && !dashboardLegacy) {
    return NextResponse.next();
  }

  const token = getSessionToken(request);
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (dashboardLegacy) {
      return NextResponse.redirect(new URL("/auth/public/login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let payload: Awaited<ReturnType<typeof verifyJwtEdge>>;
  try {
    payload = await verifyJwtEdge(token);
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (dashboardLegacy) {
      return NextResponse.redirect(new URL("/auth/public/login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (adminApi) {
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (dashboardLegacy) {
    if (payload.role === "student") {
      const suffix = pathname.replace(/^\/dashboard/, "") || "";
      return NextResponse.redirect(
        new URL(`/student${suffix}`, request.url),
      );
    }
    return NextResponse.redirect(
      new URL(getRoleHome(payload.role), request.url),
    );
  }

  if (pageGuard && !pageGuard.roles.includes(payload.role)) {
    return NextResponse.redirect(
      new URL(getRoleHome(payload.role), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/auth/:path*",
    "/admin",
    "/admin/:path*",
    "/api/admin",
    "/api/admin/:path*",
    "/leads",
    "/leads/:path*",
    "/demo",
    "/demo/:path*",
    "/mentor",
    "/mentor/:path*",
    "/teacher",
    "/teacher/:path*",
    "/student",
    "/student/:path*",
    "/parent",
    "/parent/:path*",
    "/courses",
    "/courses/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
