"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

function BookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

export function Header() {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-primary transition-opacity hover:opacity-80"
        >
          <span className="text-accent [&>svg]:h-8 [&>svg]:w-8">
            <BookIcon />
          </span>
          <span className="truncate text-lg font-bold tracking-tight sm:text-xl">
            {t("brand")}
          </span>
        </Link>

        <LanguageToggle />
      </div>
    </header>
  );
}
