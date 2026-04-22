import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { verifyJwt } from "@/server/auth/jwt";
import { DashboardCoursePlayer } from "@/components/courses/DashboardCoursePlayer";

export const dynamic = "force-dynamic";

const ADMIN_AUTH_COOKIE = "motiva_admin_auth";
const USER_AUTH_COOKIE = "motiva_user_auth";

function getSession() {
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

export default async function DashboardCoursePlayerPage({
  params,
}: {
  params: { id: string };
}) {
  const session = getSession();
  if (!session) {
    redirect("/auth/public/login");
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
