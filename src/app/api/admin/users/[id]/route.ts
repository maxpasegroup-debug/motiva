import { NextRequest, NextResponse } from "next/server";
import { deleteUserAsAdmin } from "@/server/auth/auth-users-store";
import { requireAdminApi } from "@/server/auth/require-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const id = params.id;
  await deleteUserAsAdmin(id);
  return NextResponse.json({ ok: true });
}

