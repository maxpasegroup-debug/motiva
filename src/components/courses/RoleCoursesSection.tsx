"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Course = {
  id: string;
  title: string;
  thumbnail: string;
  description: string;
  targetRole: string;
  price: number;
};

type Enrollment = { courseId: string; progress: number };

function formatPrice(price: number) {
  return price <= 0 ? "Free" : `Rs ${price.toFixed(0)}`;
}

function pct(v: number) {
  if (v <= 0) return 0;
  if (v >= 100) return 100;
  return Math.round(v);
}

export function RoleCoursesSection({
  role,
  heading,
}: {
  role: "student" | "parent" | "mentor";
  heading: string;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [coursesRes, enrollRes] = await Promise.all([
      fetch("/api/courses", { cache: "no-store" }),
      fetch("/api/courses/me/enrollments", { cache: "no-store" }),
    ]);

    if (!coursesRes.ok) {
      setError("Could not load courses");
      setLoading(false);
      return;
    }

    const coursesJson = (await coursesRes.json()) as { courses: Course[] };
    setCourses(coursesJson.courses ?? []);

    if (enrollRes.ok) {
      const enrollJson = (await enrollRes.json()) as {
        enrollments: Enrollment[];
      };
      setEnrollments(enrollJson.enrollments ?? []);
    } else {
      setEnrollments([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => courses.filter((c) => c.targetRole === role || c.targetRole === "all"),
    [courses, role],
  );

  const map = useMemo(() => {
    const m = new Map<string, number>();
    enrollments.forEach((e) => m.set(e.courseId, pct(e.progress)));
    return m;
  }, [enrollments]);

  async function enroll(courseId: string) {
    setBusyId(courseId);
    const res = await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      setError("Could not enroll");
      return;
    }
    await load();
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {loading ? (
        <p className="text-sm text-neutral-500">Loading courses...</p>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600 shadow-sm">
          No courses available yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((course) => {
            const progress = map.get(course.id);
            const enrolled = progress !== undefined;
            return (
              <div
                key={course.id}
                className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition hover:scale-[1.01]"
              >
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
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                    {course.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-neutral-600">
                    {course.description}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {formatPrice(course.price)}
                  </p>

                  {role === "student" ? (
                    <>
                      <p className="text-xs font-medium text-neutral-700">
                        {enrolled ? `Enrolled • ${progress}%` : "Not enrolled"}
                      </p>
                      {enrolled ? (
                        <>
                          <div className="h-2 w-full rounded-full bg-neutral-200">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <Link
                            href={`/dashboard/courses/${course.id}`}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                          >
                            Continue
                          </Link>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => enroll(course.id)}
                          disabled={busyId === course.id}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {busyId === course.id ? "Enrolling..." : "Enroll"}
                        </button>
                      )}
                    </>
                  ) : (
                    <Link
                      href={`/courses/${course.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                    >
                      View course
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
