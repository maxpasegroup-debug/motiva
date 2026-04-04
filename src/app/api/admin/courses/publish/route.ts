import { NextRequest, NextResponse } from "next/server";
import { publishCourseWithLessons } from "@/server/courses/courses-db";
import { getDatabaseUrl } from "@/server/db/pool";
import { requireAdminApi } from "@/server/auth/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUCCESS_MESSAGE = "Course created successfully";

function parseBody(body: unknown): {
  title: string;
  description: string | null;
  thumbnail_path: string | null;
  lessons: Array<{
    title: string;
    description: string | null;
    video_url: string;
    order: number;
  }>;
} | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  if (!title) return null;

  const description =
    typeof o.description === "string" && o.description.trim()
      ? o.description.trim()
      : null;
  const thumbnail_path =
    typeof o.thumbnail_path === "string" && o.thumbnail_path.trim()
      ? o.thumbnail_path.trim()
      : null;

  const rawLessons = o.lessons;
  if (!Array.isArray(rawLessons) || rawLessons.length === 0) return null;

  const lessons: Array<{
    title: string;
    description: string | null;
    video_url: string;
    order: number;
  }> = [];

  for (const item of rawLessons) {
    if (!item || typeof item !== "object") return null;
    const L = item as Record<string, unknown>;
    const lt = typeof L.title === "string" ? L.title.trim() : "";
    const vu = typeof L.video_url === "string" ? L.video_url.trim() : "";
    if (!lt || !vu) return null;
    const ord = L.order;
    if (typeof ord !== "number" || !Number.isFinite(ord) || ord < 0) {
      return null;
    }
    const ld =
      typeof L.description === "string" && L.description.trim()
        ? L.description.trim()
        : null;
    lessons.push({
      title: lt,
      description: ld,
      video_url: vu,
      order: Math.floor(ord),
    });
  }

  return { title, description, thumbnail_path, lessons };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;

  if (!getDatabaseUrl()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const course = await publishCourseWithLessons({
      title: parsed.title,
      description: parsed.description,
      thumbnail_path: parsed.thumbnail_path,
      lessons: parsed.lessons,
    });

    return NextResponse.json({
      message: SUCCESS_MESSAGE,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail_path: course.thumbnail_path,
        is_published: course.is_published,
        lessons: course.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          description: l.description,
          video_url: l.video_url,
          sort_order: l.sort_order,
        })),
      },
    });
  } catch (e) {
    console.error("[publish course]", e);
    return NextResponse.json(
      { error: "Could not publish course" },
      { status: 500 },
    );
  }
}
