import Link from "next/link";
import prisma from "@/lib/prisma";

function formatPrice(price: number) {
  if (price <= 0) return "Free";
  return `Rs ${price.toFixed(0)}`;
}

export default async function PublicCoursesPage() {
  const courses = await prisma.course.findMany({
    where: { status: "published", targetRole: "public" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            Recorded Courses
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Learn at your own pace with guided lessons.
          </p>
        </div>
        <Link
          href="/auth/public/login"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          Sign Up / Login
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          No published courses yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="group overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition hover:scale-[1.01]"
            >
              <div className="aspect-video w-full bg-neutral-100">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                <h2 className="line-clamp-2 text-lg font-semibold text-neutral-900">
                  {course.title}
                </h2>
                <p className="line-clamp-2 text-sm text-neutral-600">
                  {course.description}
                </p>
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(course.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
