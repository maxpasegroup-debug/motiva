import { NextRequest, NextResponse } from "next/server";
import { deleteUserAsAdmin, ensureSeedAdmin } from "@/server/auth/auth-users-store";
import { verifyJwt } from "@/server/auth/jwt";

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length !== 2) return null;
  if (parts[0] !== "Bearer") return null;
  return parts[1];
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  await ensureSeedAdmin();

  const token = getBearerToken(req);
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

  const id = params.id;
  await deleteUserAsAdmin(id);
  return NextResponse.json({ ok: true });
}

