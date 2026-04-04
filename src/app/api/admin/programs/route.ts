import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/server/auth/require-admin";
import { createProgram, readPrograms } from "@/server/programs/programs-store";

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const programs = await readPrograms();
  return NextResponse.json({ programs });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  const body = (await req.json()) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;

  const title = typeof o.title === "string" ? o.title : "";
  const subtitle = typeof o.subtitle === "string" ? o.subtitle : "";
  const image_url = typeof o.image_url === "string" ? o.image_url : "";
  const description = typeof o.description === "string" ? o.description : "";
  const durationRaw = o.duration;
  const duration = durationRaw === 25 ? 25 : 12;

  if (!title.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const is_active =
    typeof o.is_active === "boolean" ? o.is_active : true;

  const program = await createProgram({
    title,
    subtitle,
    duration,
    image_url,
    description,
    is_active,
  });

  return NextResponse.json({ program }, { status: 201 });
}
