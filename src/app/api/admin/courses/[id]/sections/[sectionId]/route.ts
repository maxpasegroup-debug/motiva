import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SECTION_TYPES } from "@/lib/recorded-courses";
import { requireAdminApi } from "@/server/auth/require-admin";

type Ctx = { params: { id: string; sectionId: string } };

export async function PUT(req: NextRequest, context: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const { id: courseId, sectionId } = context.params;

  const section = await prisma.courseSection.findFirst({
    where: { id: sectionId, courseId },
    include: { videos: { orderBy: { order: "asc" } } },
  });
  if (!section) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const type =
    typeof b.type === "string" ? b.type.trim() : section.type;
  const sectionTitle =
    typeof b.sectionTitle === "string" ? b.sectionTitle.trim() : section.sectionTitle;
  const order =
    typeof b.order === "number" && Number.isFinite(b.order)
      ? b.order
      : section.order;

  if (!sectionTitle) {
    return NextResponse.json(
      { error: "sectionTitle is required" },
      { status: 400 },
    );
  }
  if (!(SECTION_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json(
      { error: "type must be intro or lesson" },
      { status: 400 },
    );
  }

  if (type === "intro") {
    const other = await prisma.courseSection.findFirst({
      where: { courseId, type: "intro", id: { not: sectionId } },
    });
    if (other) {
      return NextResponse.json(
        { error: "This course already has an introduction section" },
        { status: 400 },
      );
    }
  }

  let firstVideo = section.videos[0] ?? null;
  const videoRaw = b.video;
  if (videoRaw && typeof videoRaw === "object") {
    const v = videoRaw as Record<string, unknown>;
    const videoTitle =
      typeof v.videoTitle === "string" ? v.videoTitle.trim() : firstVideo?.videoTitle;
    const videoUrl =
      typeof v.videoUrl === "string" ? v.videoUrl.trim() : firstVideo?.videoUrl;
    const description =
      typeof v.description === "string" ? v.description : firstVideo?.description ?? "";
    if (!videoTitle || !videoUrl) {
      return NextResponse.json(
        { error: "videoTitle and videoUrl are required in video" },
        { status: 400 },
      );
    }
    if (firstVideo) {
      firstVideo = await prisma.courseVideo.update({
        where: { id: firstVideo.id },
        data: { videoTitle, videoUrl, description },
      });
    } else {
      firstVideo = await prisma.courseVideo.create({
        data: {
          sectionId,
          videoTitle,
          videoUrl,
          description,
          order: 0,
        },
      });
    }
  }

  const updated = await prisma.courseSection.update({
    where: { id: sectionId },
    data: {
      type,
      sectionTitle,
      order,
    },
    include: { videos: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ section: updated });
}

export async function DELETE(req: NextRequest, context: Ctx) {
  const auth = await requireAdminApi(req);
  if (!auth.ok) return auth.response;
  const { id: courseId, sectionId } = context.params;

  const section = await prisma.courseSection.findFirst({
    where: { id: sectionId, courseId },
  });
  if (!section) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.courseSection.delete({ where: { id: sectionId } });
  return NextResponse.json({ ok: true });
}
export const dynamic = "force-dynamic";
