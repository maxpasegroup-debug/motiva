import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifyJwt, type JwtPayload } from "@/server/auth/jwt";

export const dynamic = "force-dynamic";

const ADMIN_AUTH_COOKIE = "motiva_admin_auth";
const USER_AUTH_COOKIE = "motiva_user_auth";

function getTokenPayload(): JwtPayload | null {
  const store = cookies();
  const token =
    store.get(USER_AUTH_COOKIE)?.value ?? store.get(ADMIN_AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace("www.", "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtu.be") {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function PublicCoursePreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const payload = getTokenPayload();

  const course = await prisma.course.findFirst({
    where: { id: params.id, status: "published" },
    include: {
      sections: {
        orderBy: { order: "asc" },
        include: { videos: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!course) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-neutral-600">Course not found.</p>
      </main>
    );
  }

  const enrollment = payload
    ? await prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId: payload.sub,
            courseId: course.id,
          },
        },
      })
    : null;

  const lessons = course.sections.map((s) => ({
    id: s.id,
    sectionTitle: s.sectionTitle,
    type: s.type,
    video: s.videos[0] ?? null,
  }));

  const firstVideo = lessons.find((l) => l.video)?.video ?? null;
  const embed = firstVideo ? getEmbedUrl(firstVideo.videoUrl) : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="aspect-video w-full bg-neutral-100">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail}
              alt={course.title}
              className="h-full w-full object-cover"
              width={400}
              height={225}
            />
          ) : null}
        </div>
        <div className="space-y-3 p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-neutral-900">{course.title}</h1>
          <p className="text-sm leading-relaxed text-neutral-700">
            {course.description}
          </p>
        </div>
      </div>

      {enrollment ? (
        <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Watch Course</h2>
            <p className="text-sm text-neutral-600">
              You are enrolled. Continue in the full player.
            </p>
          </div>

          {firstVideo ? (
            <>
              <h3 className="text-lg font-semibold text-neutral-900">
                {firstVideo.videoTitle}
              </h3>
              {embed ? (
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-neutral-200">
                  <iframe
                    src={embed}
                    title={firstVideo.videoTitle}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <p className="text-sm text-neutral-600">
                  This video provider is not supported for inline preview.
                </p>
              )}
              <p className="text-sm text-neutral-700">{firstVideo.description}</p>
              <Link
                href={`/dashboard/courses/${course.id}`}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
              >
                Open full player
              </Link>
            </>
          ) : (
            <p className="text-sm text-neutral-600">No lessons added yet.</p>
          )}
        </section>
      ) : (
        <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-neutral-900">Lessons</h2>
          <ul className="space-y-3">
            {lessons.map((lesson, i) => (
              <li
                key={lesson.id}
                className="rounded-lg border border-neutral-200 p-3 sm:p-4"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {lesson.type === "intro" ? "Introduction" : `Lesson ${i + 1}`}
                </p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {lesson.sectionTitle}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-neutral-700">
                  <span aria-hidden>🔒</span>
                  <span>{lesson.video?.videoTitle ?? "Video"}</span>
                </p>
              </li>
            ))}
          </ul>
          <Link
            href="/auth/public/login"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Sign up to watch this course
          </Link>
        </section>
      )}
    </main>
  );
}
