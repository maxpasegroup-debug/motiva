import type { Metadata } from "next";
import Link from "next/link";
import { AdminAdmissionsPage } from "@/components/admin/AdminAdmissionsPage";

export const metadata: Metadata = {
  title: "Admissions - Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2">
        <Link
          href="/admin/admissions/create-account"
          className="rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm transition hover:border-blue-300 hover:bg-blue-100"
        >
          <p className="text-3xl" aria-hidden>
            🧑‍🎓
          </p>
          <h2 className="mt-3 text-lg font-semibold text-blue-950">
            New Tuition Student
          </h2>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            Add a tuition student and create student/parent login.
          </p>
        </Link>
        <Link
          href="/admin/admissions/remedial"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
        >
          <p className="text-3xl" aria-hidden>
            📘
          </p>
          <h2 className="mt-3 text-lg font-semibold text-emerald-950">
            New Remedial Student
          </h2>
          <p className="mt-1 text-sm leading-6 text-emerald-800">
            Start a 12-day or 25-day remedial admission flow.
          </p>
        </Link>
      </section>
      <AdminAdmissionsPage />
    </div>
  );
}
