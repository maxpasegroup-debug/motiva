"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CourseAudienceRole } from "@/lib/recorded-courses";

type Program = {
  id: string;
  title: string;
  description: string;
  image_path: string;
};

export function RoleProgramsSection({
  role,
  heading,
}: {
  role: CourseAudienceRole;
  heading: string;
}) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/programs?audience=${role}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { programs: [] }))
      .then((body: { programs?: Program[] }) => {
        if (!cancelled) setPrograms(body.programs ?? []);
      })
      .catch(() => {
        if (!cancelled) setPrograms([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role]);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      {loading ? (
        <p className="text-sm text-neutral-500">Loading programs...</p>
      ) : programs.length === 0 ? (
        <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-600 shadow-sm">
          No live programs available yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {programs.map((program) => (
            <Link
              key={program.id}
              href={`/admission?program=${encodeURIComponent(program.id)}`}
              className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm transition hover:scale-[1.01]"
            >
              <div className="aspect-video w-full bg-neutral-100">
                {program.image_path ? (
                  <Image
                    src={program.image_path}
                    alt={program.title}
                    width={480}
                    height={270}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="space-y-2 p-4">
                <h3 className="line-clamp-2 text-base font-semibold text-foreground">
                  {program.title}
                </h3>
                <p className="line-clamp-2 text-sm text-neutral-600">
                  {program.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
