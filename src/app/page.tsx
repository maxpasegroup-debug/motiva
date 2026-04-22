import prisma from "@/lib/prisma";
import { LandingPage } from "@/components/views/LandingPage";

export const dynamic = "force-dynamic";

export default async function Page() {
  const courses = await prisma.course.findMany({
    where: { status: "published", targetRole: "public" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      thumbnail: true,
      price: true,
    },
  });

  return <LandingPage courses={courses} />;
}
