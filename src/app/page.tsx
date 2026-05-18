import prisma from "@/lib/prisma";
import { LandingPage } from "@/components/views/LandingPage";
import { courseIsVisibleToAudience } from "@/lib/recorded-courses";

export const dynamic = "force-dynamic";

export default async function Page() {
  const courses = (await prisma.course.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      thumbnail: true,
      price: true,
      targetRole: true,
    },
  })).filter((course) => courseIsVisibleToAudience(course.targetRole, "public"));

  return <LandingPage courses={courses} />;
}
