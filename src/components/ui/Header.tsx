"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

export function Header() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-100 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <Link
          href="/"
          className="group flex shrink-0 items-center self-start sm:self-auto"
          aria-label={t("brand")}
        >
          <img
            src="/logo.png"
            alt=""
            className="h-9 w-auto object-contain transition duration-200 motion-safe:group-hover:scale-105 sm:h-10"
            decoding="async"
          />
        </Link>

        <nav className="flex flex-wrap items-center gap-4 sm:justify-end sm:gap-6">
          <Link
            href="/#programs"
            className="min-h-11 text-base font-medium text-gray-700 transition-colors duration-200 hover:text-blue-600"
          >
            {t("nav_programs")}
          </Link>
          <Link
            href="/login"
            className="min-h-11 text-base font-medium text-gray-700 transition-colors duration-200 hover:text-blue-600"
          >
            {t("nav_admission")}
          </Link>
          <LanguageToggle variant="header" />
          <Link
            href="/login"
            className="inline-flex min-h-11 min-w-[5.5rem] touch-manipulation items-center justify-center rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform duration-200 hover:bg-orange-600 motion-safe:hover:scale-105 motion-safe:active:scale-100"
          >
            {t("login")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
