import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { MentorAdmissionForm } from "@/components/mentor/MentorAdmissionForm";
import { requireMentorSession } from "@/server/mentor/auth";

export const metadata: Metadata = {
  title: "Create Admission - Mentor",
};

export const dynamic = "force-dynamic";

export default async function NewMentorAdmissionPage() {
  requireMentorSession();

  const [teachers, batches] = await Promise.all([
    prisma.user.findMany({
      where: { role: "teacher", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.batch.findMany({
      select: { id: true, name: true, duration: true, teacherId: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm font-medium text-blue-700">Mentor Admissions</p>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">
          Create Admission
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          Create an admitted student, record the fee, and allocate the teacher
          and batch from your mentor panel.
        </p>
      </section>
      <MentorAdmissionForm teachers={teachers} batches={batches} />
    </div>
  );
}
