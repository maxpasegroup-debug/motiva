import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/require-admin";
import { deleteProgram, updateProgram } from "@/server/programs/programs-store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;

  const patch: Parameters<typeof updateProgram>[1] = {};
  if (typeof o.title === "string") patch.title = o.title;
  if (typeof o.subtitle === "string") patch.subtitle = o.subtitle;
  if (typeof o.image_url === "string") patch.image_url = o.image_url;
  if (typeof o.description === "string") patch.description = o.description;
  if (typeof o.duration === "number") patch.duration = o.duration;
  if (typeof o.is_active === "boolean") patch.is_active = o.is_active;

  const program = await updateProgram(params.id, patch);
  if (!program) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ program });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const ok = await deleteProgram(params.id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
