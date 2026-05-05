import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AUTH_COOKIE_NAME } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";
import { DashboardCoursePlayer } from "@/components/courses/DashboardCoursePlayer";

export const dynamic = "force-dynamic";

function getSession() {
  const store = cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return verifyJwt(token);
  } catch {
    return null;
  }
}

export default async function DashboardCoursePlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const session = getSession();
  if (!session) {
    redirect("/login");
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.sub,
        courseId: params.id,
      },
    },
    include: {
      course: {
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              videos: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) {
    redirect(`/courses/${params.id}`);
  }

  const lessons = enrollment.course.sections.map((s) => {
    const v = s.videos[0] ?? null;
    return {
      id: s.id,
      type: s.type,
      sectionTitle: s.sectionTitle,
      videoTitle: v?.videoTitle ?? "Video",
      videoUrl: v?.videoUrl ?? "",
      description: v?.description ?? "",
    };
  });

  return (
    <DashboardCoursePlayer
      courseId={enrollment.courseId}
      courseTitle={enrollment.course.title}
      initialProgress={enrollment.progress}
      lessons={lessons}
    />
  );
}
