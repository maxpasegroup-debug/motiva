import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function redirectToUnifiedLogin(req: NextRequest) {
  return NextResponse.redirect(new URL("/api/auth/login", req.url), 301);
}

export const GET = redirectToUnifiedLogin;
export const POST = redirectToUnifiedLogin;
