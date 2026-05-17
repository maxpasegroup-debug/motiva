"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  LogOut,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { RoleCoursesSection } from "@/components/courses/RoleCoursesSection";
import { RoleProgramsSection } from "@/components/programs/RoleProgramsSection";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { clearSession } from "@/lib/session";
import type { TranslationKey } from "@/lib/i18n";

const ACTIONS: {
  href: string;
  labelKey: TranslationKey;
  helper: string;
  icon: LucideIcon;
}[] = [
  {
    href: "/teacher/classes",
    labelKey: "teacher_nav_classes",
    helper: "Open batches, class days, and lesson flow.",
    icon: CalendarDays,
  },
  {
    href: "/teacher/students",
    labelKey: "teacher_nav_students",
    helper: "See students and their current progress.",
    icon: UsersRound,
  },
  {
    href: "/teacher/attendance",
    labelKey: "teacher_nav_attendance",
    helper: "Mark attendance after each session.",
    icon: ClipboardCheck,
  },
  {
    href: "/teacher/upload",
    labelKey: "teacher_nav_upload",
    helper: "Upload class notes or learning material.",
    icon: BookOpenCheck,
  },
];

export function TeacherDashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();

  function handleLogOut() {
    clearSession();
    router.push("/");
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm font-medium text-blue-700">Teacher Portal</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
          {t("teacher_home_title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
          Start with classes, students, attendance, or materials. Everything is kept in the order a teacher usually works.
        </p>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-base font-semibold text-neutral-950">Today&apos;s Work</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {ACTIONS.map(({ href, labelKey, helper, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-20 items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 transition hover:bg-blue-50"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-neutral-200">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-neutral-950">
                  {t(labelKey)}
                </span>
                <span className="mt-1 block text-xs leading-5 text-neutral-500">
                  {helper}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <RoleCoursesSection role="teacher" heading="Teacher Courses" />
      <RoleProgramsSection role="teacher" heading="Live Programs" />

      <button
        type="button"
        onClick={handleLogOut}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 sm:w-auto"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        {t("log_out")}
      </button>
    </div>
  );
}
