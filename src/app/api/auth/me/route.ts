import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";

export async function GET(req: NextRequest) {
  const token = getSessionToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = verifyJwt(token);
    return NextResponse.json({
      userId: payload.sub,
      role: payload.role,
      name: payload.name,
      mobile: payload.mobile ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export const dynamic = "force-dynamic";
