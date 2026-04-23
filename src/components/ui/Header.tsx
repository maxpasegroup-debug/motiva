"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

export function Header() {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinkClass =
    "min-h-12 rounded-xl px-3 text-base font-semibold text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 hover:text-[#0B5ED7] sm:min-h-11";

  const links = [
    { href: "/#programs", label: t("nav_programs") },
    { href: "/#teachers", label: "Teachers" },
    { href: "/courses", label: "Courses" },
    { href: "/about", label: t("nav_about") },
    { href: "/#enquiry-form", label: t("nav_contact") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center"
          aria-label={t("brand")}
        >
          <Image
            src="/logo.png"
            alt=""
            className="h-9 w-auto object-contain transition duration-300 motion-safe:group-hover:scale-105 sm:h-11"
            width={120}
            height={40}
            decoding="async"
          />
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex md:gap-2"
          aria-label="Main"
        >
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3 md:flex-initial">
          <div className="flex items-center border-r border-neutral-200 pr-2 sm:pr-3 md:border-0 md:pr-0">
            <LanguageToggle variant="header" />
          </div>
          <Link
            href="/login"
            className="inline-flex min-h-12 shrink-0 touch-manipulation items-center justify-center rounded-2xl bg-gradient-to-b from-[#0B5ED7] to-[#2563eb] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(11,94,215,0.45)] transition-all duration-200 hover:shadow-[0_12px_28px_-6px_rgba(11,94,215,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B5ED7] motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98] sm:min-h-11 sm:px-6"
          >
            {t("login")}
          </Link>

          <button
            type="button"
            className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-800 shadow-sm md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">Menu</span>
            {menuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-neutral-100 bg-white px-4 py-4 shadow-inner md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile main">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="min-h-14 rounded-2xl px-4 py-3 text-lg font-semibold text-neutral-800 active:bg-neutral-100"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
