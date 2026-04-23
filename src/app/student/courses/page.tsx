import Image from "next/image";
import Link from "next/link";
import { requireStudentSession } from "@/server/student/auth";
import { getStudentCourses } from "@/server/student/data";

export const dynamic = "force-dynamic";

export default async function StudentCoursesPage() {
  const session = requireStudentSession();
  const enrollments = await getStudentCourses(session.userId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">My Courses</h1>
          <p className="mt-2 text-sm text-neutral-600">
            All enrolled courses with progress and quick continue actions.
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Browse Courses
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {enrollments.length > 0 ? (
          enrollments.map((enrollment) => (
            <div key={enrollment.id} className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
              <div className="relative aspect-video bg-neutral-100">
                {enrollment.course.thumbnail ? (
                  <Image
                    src={enrollment.course.thumbnail}
                    alt={enrollment.course.title}
                    fill
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="space-y-4 p-5">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {enrollment.course.title}
                </h2>
                <div className="h-2 rounded-full bg-neutral-200">
                  <div
                    className="h-2 rounded-full bg-neutral-900"
                    style={{ width: `${Math.max(0, Math.min(100, enrollment.progress))}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500">{enrollment.progress}% complete</p>
                <Link
                  href={`/dashboard/courses/${enrollment.courseId}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Continue Watching
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
            No enrolled courses yet.
          </div>
        )}
      </div>
    </div>
  );
}
