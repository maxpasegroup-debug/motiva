import type { Metadata } from "next";
import { Suspense } from "react";
import { CoursePlayerView } from "@/components/course/CoursePlayerView";

type Props = { params: { id: string } };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Course — Motiva Edus",
    description: "Watch lessons and learn at your pace.",
  };
}

function CourseFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-center text-neutral-500">
      Loading…
    </div>
  );
}

export default function CoursePage({ params }: Props) {
  return (
    <Suspense fallback={<CourseFallback />}>
      <CoursePlayerView courseId={params.id} />
    </Suspense>
  );
}
