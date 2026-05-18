import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRoleHome, type Role } from "@/lib/roles";
import { AUTH_COOKIE_NAME, getBearerToken } from "@/server/auth/http-auth";
import { verifyJwtEdge } from "@/server/auth/jwt-edge";

function getSessionToken(req: NextRequest): string | null {
  const bearer = getBearerToken(req);
  if (bearer) return bearer;
  return req.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}

type Guard = { prefix: string; roles: readonly Role[] };

const adminPortalRoles: readonly Role[] = [
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

const admissionsRoles: readonly Role[] = [
  "admin",
  "telecounselor",
  "administrative_officer",
  "manager",
];

const academicRoles: readonly Role[] = [
  "admin",
  "manager",
  "academic_coordinator",
  "teacher",
  "mentor",
];

const moneyRoles: readonly Role[] = [
  "admin",
  "manager",
  "administrative_officer",
  "telecounselor",
];

const staffRoles: readonly Role[] = ["admin", "manager", "hr"];

const PAGE_GUARDS: Guard[] = [
  { prefix: "/admin/leads", roles: admissionsRoles },
  { prefix: "/admin/enquiries", roles: admissionsRoles },
  { prefix: "/admin/admissions", roles: admissionsRoles },
  { prefix: "/admin/students", roles: [...academicRoles, "administrative_officer"] },
  { prefix: "/admin/parents", roles: ["admin", "manager", "administrative_officer"] },
  { prefix: "/admin/payments", roles: moneyRoles },
  { prefix: "/admin/batches", roles: academicRoles },
  { prefix: "/admin/classes", roles: academicRoles },
  { prefix: "/admin/attendance", roles: academicRoles },
  { prefix: "/admin/teachers", roles: ["admin", "manager", "academic_coordinator", "hr", "teacher"] },
  { prefix: "/admin/courses", roles: ["admin", "manager", "academic_coordinator"] },
  { prefix: "/admin/users", roles: staffRoles },
  { prefix: "/admin/reports", roles: ["admin", "manager", "administrative_officer", "academic_coordinator"] },
  { prefix: "/admin/settings", roles: ["admin", "manager", "administrative_officer"] },
  {
    prefix: "/admin/admissions/create-account",
    roles: admissionsRoles,
  },
  {
    prefix: "/admin/admissions/remedial",
    roles: admissionsRoles,
  },
  { prefix: "/admin", roles: adminPortalRoles },
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

function adminApiAllowedRoles(pathname: string): readonly Role[] {
  if (pathname === "/api/admin/me" || pathname === "/api/admin/logout") {
    return adminPortalRoles;
  }
  if (pathname === "/api/admin/users" || pathname.startsWith("/api/admin/users/")) {
    return staffRoles;
  }
  if (pathname === "/api/admin/enquiries" || pathname.startsWith("/api/admin/enquiries/")) {
    return admissionsRoles;
  }
  if (pathname === "/api/admin/admissions" || pathname.startsWith("/api/admin/admissions/")) {
    return admissionsRoles;
  }
  if (pathname === "/api/admin/parents/register") {
    return admissionsRoles;
  }
  if (pathname === "/api/admin/batches" || pathname.startsWith("/api/admin/batches/")) {
    return [...academicRoles, ...admissionsRoles];
  }
  if (pathname === "/api/admin/teachers" || pathname.startsWith("/api/admin/teachers/")) {
    return ["admin", "manager", "academic_coordinator", "hr"];
  }
  if (pathname === "/api/admin/reports" || pathname.startsWith("/api/admin/reports/")) {
    return ["admin", "manager", "administrative_officer", "academic_coordinator"];
  }
  if (pathname === "/api/admin/students" || pathname.startsWith("/api/admin/students/")) {
    return [...academicRoles, "administrative_officer", ...moneyRoles];
  }
  if (pathname === "/api/admin/courses" || pathname.startsWith("/api/admin/courses/")) {
    return ["admin", "manager", "academic_coordinator"];
  }
  if (pathname === "/api/admin/programs" || pathname.startsWith("/api/admin/programs/")) {
    return ["admin", "manager"];
  }
  if (
    pathname === "/api/admin/leads" ||
    pathname.startsWith("/api/admin/leads/")
  ) {
    return admissionsRoles;
  }
  return ["admin"];
}

function paymentsApiAllowedRoles(pathname: string): readonly Role[] {
  if (
    pathname === "/api/payments/create-order" ||
    pathname.startsWith("/api/payments/create-order/") ||
    pathname === "/api/payments/verify" ||
    pathname.startsWith("/api/payments/verify/")
  ) {
    return moneyRoles;
  }
  return [];
}

function internalApiAllowedRoles(pathname: string): readonly Role[] {
  if (pathname === "/api/student" || pathname.startsWith("/api/student/")) {
    return ["student"];
  }
  if (pathname === "/api/parent" || pathname.startsWith("/api/parent/")) {
    return ["parent"];
  }
  return [];
}

function loginUrlFor(pathname: string, request: NextRequest): URL {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return new URL("/login", request.url);
  }
  return new URL("/login", request.url);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const adminApi = isProtectedAdminApi(pathname);
  const paymentsApi = pathname.startsWith("/api/payments/");
  const internalApi =
    pathname.startsWith("/api/student/") || pathname.startsWith("/api/parent/");
  const pageGuard = guardForPath(pathname);
  const dashboardLegacy =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (!adminApi && !paymentsApi && !internalApi && !pageGuard && !dashboardLegacy) {
    return NextResponse.next();
  }

  const token = getSessionToken(request);
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(loginUrlFor(pathname, request));
  }

  let payload: Awaited<ReturnType<typeof verifyJwtEdge>>;
  try {
    payload = await verifyJwtEdge(token);
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(loginUrlFor(pathname, request));
  }

  if (adminApi) {
    const allowed = adminApiAllowedRoles(pathname);
    if (!allowed.includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (paymentsApi) {
    const allowed = paymentsApiAllowedRoles(pathname);
    if (!allowed.includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (internalApi) {
    const allowed = internalApiAllowedRoles(pathname);
    if (!allowed.includes(payload.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (dashboardLegacy) {
    if (payload.role === "public") {
      return NextResponse.next();
    }
    if (payload.role === "student") {
      const suffix = pathname.replace(/^\/dashboard/, "") || "";
      return NextResponse.redirect(new URL(`/student${suffix}`, request.url));
    }
    return NextResponse.redirect(new URL(getRoleHome(payload.role), request.url));
  }

  if (pageGuard && !pageGuard.roles.includes(payload.role)) {
    return NextResponse.redirect(new URL(getRoleHome(payload.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin",
    "/admin/:path*",
    "/api/admin",
    "/api/admin/:path*",
    "/api/payments/:path*",
    "/api/student/:path*",
    "/api/parent/:path*",
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
