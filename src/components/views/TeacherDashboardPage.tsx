"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { clearSession } from "@/lib/session";
import type { TranslationKey } from "@/lib/i18n";

const MENU: {
  href: string;
  emoji: string;
  labelKey: TranslationKey;
}[] = [
  { href: "/teacher/classes", emoji: "📅", labelKey: "teacher_nav_classes" },
  { href: "/teacher/students", emoji: "👥", labelKey: "teacher_nav_students" },
];

export function TeacherDashboardPage() {
  const { t } = useLanguage();
  const router = useRouter();

  function handleLogOut() {
    clearSession();
    router.push("/");
  }

  return (
    <div className="space-y-10">
      <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
        {t("teacher_home_title")}
      </h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {MENU.map(({ href, emoji, labelKey }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-md transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-[180px]"
          >
            <span className="text-5xl leading-none sm:text-6xl" aria-hidden>
              {emoji}
            </span>
            <span className="text-lg font-semibold text-foreground group-hover:text-primary sm:text-xl">
              {t(labelKey)}
            </span>
          </Link>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 pt-4">
        <Button type="button" variant="outline" onClick={handleLogOut}>
          {t("log_out")}
        </Button>
        <Link
          href="/"
          className="text-sm font-medium text-neutral-500 underline-offset-4 hover:text-primary hover:underline"
        >
          ← {t("home")}
        </Link>
      </div>
    </div>
  );
}
