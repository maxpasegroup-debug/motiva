import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { getRoleHome, isRole } from "@/lib/roles";
import { AUTH_COOKIE_NAME } from "@/server/auth/http-auth";
import { verifyJwt } from "@/server/auth/jwt";

type Session = {
  userId: string;
  role: string;
};

export const metadata: Metadata = {
  title: "Dashboard — Motiva Edus",
};

export const dynamic = "force-dynamic";

function getSession(): Session | null {
  const store = cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const payload = verifyJwt(token);
    return { userId: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

function formatPct(v: number) {
  if (v <= 0) return 0;
  if (v >= 100) return 100;
  return Math.round(v);
}

export default async function Page() {
  const session = getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.role !== "public") {
    if (isRole(session.role)) {
      redirect(getRoleHome(session.role));
    }
    redirect("/login");
  }

  const rows = await prisma.courseEnrollment.findMany({
    where: { userId: session.userId },
    include: { course: true },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
            My Courses
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Continue from where you left off.
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
        >
          Browse more courses
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
          You have no enrolled courses yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => {
            const p = formatPct(row.progress);
            return (
              <Link
                key={row.id}
                href={`/dashboard/courses/${row.courseId}`}
                className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition hover:scale-[1.01]"
              >
                <div className="aspect-video w-full bg-neutral-100">
                  {row.course.thumbnail ? (
                    <Image
                      src={row.course.thumbnail}
                      alt={row.course.title}
                      className="h-full w-full object-cover"
                      width={400}
                      height={225}
                    />
                  ) : null}
                </div>
                <div className="space-y-3 p-4">
                  <h2 className="line-clamp-2 text-lg font-semibold text-neutral-900">
                    {row.course.title}
                  </h2>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-neutral-600">
                      <span>Progress</span>
                      <span>{p}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-200">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
