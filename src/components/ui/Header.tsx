"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

export function Header() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/90 bg-white/95 shadow-md shadow-neutral-900/[0.07] backdrop-blur-md">
      <div className="mx-auto flex min-h-[4.25rem] max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:min-h-[4.75rem] sm:gap-4 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3"
          aria-label={t("brand")}
        >
          <img
            src="/logo.png"
            alt=""
            className="h-8 w-auto shrink-0 object-contain transition duration-200 ease-out sm:h-10 md:h-12 motion-safe:group-hover:scale-105"
            decoding="async"
          />
          <span className="truncate text-lg font-bold tracking-tight text-blue-700 sm:text-xl">
            {t("brand")}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-11 touch-manipulation items-center justify-center rounded-xl bg-gradient-to-b from-[#F59E0B] to-accent px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-accent/25 transition-[transform,box-shadow,filter] duration-200 ease-out hover:shadow-lg hover:shadow-accent/30 motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98] sm:min-h-12 sm:px-5 sm:text-base"
          >
            {t("login")}
          </Link>
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
