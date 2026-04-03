import { NextRequest, NextResponse } from "next/server";
import { ensureSeedAdmin } from "@/server/auth/auth-users-store";
import { verifyJwt } from "@/server/auth/jwt";
import { createProgram, readPrograms } from "@/server/programs/programs-store";

function getBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length !== 2) return null;
  if (parts[0] !== "Bearer") return null;
  return parts[1];
}

export async function GET(req: NextRequest) {
  await ensureSeedAdmin();
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const payload = verifyJwt(token);
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const programs = await readPrograms();
  return NextResponse.json({ programs });
}

export async function POST(req: NextRequest) {
  await ensureSeedAdmin();
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const payload = verifyJwt(token);
    if (payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
