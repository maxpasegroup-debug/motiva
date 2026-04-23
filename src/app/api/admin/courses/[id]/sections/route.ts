import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SECTION_TYPES } from "@/lib/recorded-courses";
import { requireAdminApi } from "@/server/auth/require-admin";

type Ctx = { params: { id: string } };

export async function POST(req: NextRequest, context: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const { id: courseId } = context.params;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const type = typeof b.type === "string" ? b.type.trim() : "";
  const sectionTitle =
    typeof b.sectionTitle === "string" ? b.sectionTitle.trim() : "";
  const videoRaw = b.video;

  if (!(SECTION_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json(
      { error: "type must be intro or lesson" },
      { status: 400 },
    );
  }
  if (!sectionTitle) {
    return NextResponse.json(
      { error: "sectionTitle is required" },
      { status: 400 },
    );
  }
  if (!videoRaw || typeof videoRaw !== "object") {
    return NextResponse.json(
      { error: "video object is required" },
      { status: 400 },
    );
  }

  const v = videoRaw as Record<string, unknown>;
  const videoTitle =
    typeof v.videoTitle === "string" ? v.videoTitle.trim() : "";
  const videoUrl = typeof v.videoUrl === "string" ? v.videoUrl.trim() : "";
  const description =
    typeof v.description === "string" ? v.description : "";

  if (!videoTitle || !videoUrl) {
    return NextResponse.json(
      { error: "videoTitle and videoUrl are required" },
      { status: 400 },
    );
  }

  if (type === "intro") {
    const hasIntro = await prisma.courseSection.findFirst({
      where: { courseId, type: "intro" },
    });
    if (hasIntro) {
      return NextResponse.json(
        { error: "This course already has an introduction section" },
        { status: 400 },
      );
    }
  }

  const maxRow = await prisma.courseSection.aggregate({
    where: { courseId },
    _max: { order: true },
  });
  const nextOrder = (maxRow._max.order ?? -1) + 1;

  const section = await prisma.courseSection.create({
    data: {
      courseId,
      type,
      sectionTitle,
      order: nextOrder,
      videos: {
        create: {
          videoTitle,
          videoUrl,
          description,
          order: 0,
        },
      },
    },
    include: { videos: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ section });
}
export const dynamic = "force-dynamic";
