import { NextRequest, NextResponse } from "next/server";
import {
  ensureSeedAdminDb,
  findAdminById,
  isDatabaseConfigured,
  toPublicAdmin,
} from "@/server/auth/admins-store";
import { getAdminSessionToken } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";

export async function GET(req: NextRequest) {
  const token = getAdminSessionToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = verifyJwt(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (payload.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isDatabaseConfigured()) {
    await ensureSeedAdminDb();
    const admin = await findAdminById(payload.sub);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ admin: toPublicAdmin(admin) });
  }

  return NextResponse.json({
    admin: {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    },
  });
}
