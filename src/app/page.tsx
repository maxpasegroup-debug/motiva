import prisma from "@/lib/prisma";
import { LandingPage } from "@/components/views/LandingPage";
import { courseIsVisibleToAudience } from "@/lib/recorded-courses";

export const dynamic = "force-dynamic";

type PublicCourse = {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
  targetRole: string;
};

async function getPublicCourses(): Promise<PublicCourse[]> {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

  if (!hasDatabaseUrl && process.env.NODE_ENV !== "production") {
    return [];
  }

  try {
    const courses = await prisma.course.findMany({
      where: { status: "published" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        price: true,
        targetRole: true,
      },
    });

    return courses.filter((course) =>
      courseIsVisibleToAudience(course.targetRole, "public"),
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[home] Could not load public courses:", error);
      return [];
    }

    throw error;
  }
}

export default async function Page() {
  const courses = await getPublicCourses();

  return <LandingPage courses={courses} />;
}
