"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

const copy = {
  en: {
    programs: "Programs",
    courses: "Courses",
    teachers: "Teachers",
    about: "About",
    contact: "Contact",
    enquiry: "Enquire Now",
    portal: "Portal",
    menu: "Menu",
    items: [
      ["One-to-One Tuition", "/#one-to-one"],
      ["12 Day Remedial", "/#remedial"],
      ["25 Day Remedial", "/#remedial"],
      ["Public Speaking", "/#public-speaking"],
      ["Career Counseling", "/#career-counseling"],
    ],
  },
  ml: {
    programs: "പ്രോഗ്രാമുകൾ",
    courses: "കോഴ്സുകൾ",
    teachers: "ടീച്ചേഴ്സ്",
    about: "About",
    contact: "Contact",
    enquiry: "എൻക്വയർ",
    portal: "Portal",
    menu: "മെനു",
    items: [
      ["വൺ-ടു-വൺ ട്യൂഷൻ", "/#one-to-one"],
      ["12 ദിവസ റിമീഡിയൽ", "/#remedial"],
      ["25 ദിവസ റിമീഡിയൽ", "/#remedial"],
      ["പബ്ലിക് സ്പീക്കിംഗ്", "/#public-speaking"],
      ["കരിയർ കൗൺസലിംഗ്", "/#career-counseling"],
    ],
  },
} as const;

export function Header() {
  const { locale } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const c = copy[locale];

  const navLinkClass =
    "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-neutral-700 transition-colors duration-200 hover:bg-neutral-100 hover:text-[#0B5ED7]";

  const links = [
    { href: "/courses", label: c.courses },
    { href: "/#teachers", label: c.teachers },
    { href: "/about", label: c.about },
    { href: "/#enquiry-form", label: c.contact },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 shadow-[0_4px_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="group flex shrink-0 items-center"
          aria-label="Motiva Edus"
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

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          <div className="group relative">
            <Link href="/#programs" className={navLinkClass}>
              {c.programs}
              <span className="ml-1 text-xs text-neutral-400" aria-hidden>
                v
              </span>
            </Link>
            <div className="invisible absolute left-0 top-full w-64 translate-y-2 rounded-xl border border-neutral-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              {c.items.map(([label, href]) => (
                <Link
                  key={href + label}
                  href={href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-blue-50 hover:text-[#0B5ED7]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2 lg:flex-initial">
          <LanguageToggle variant="header" />
          <Link
            href="/login"
            className="hidden min-h-11 shrink-0 items-center justify-center rounded-lg border border-neutral-200 px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-neutral-50 sm:inline-flex"
          >
            {c.portal}
          </Link>
          <Link
            href="/#enquiry-form"
            className="hidden min-h-11 shrink-0 items-center justify-center rounded-lg bg-[#0B5ED7] px-5 py-2 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(11,94,215,0.55)] transition hover:bg-[#094fb6] sm:inline-flex"
          >
            {c.enquiry}
          </Link>

          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-sm lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">{c.menu}</span>
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
          className="border-t border-neutral-100 bg-white px-4 py-4 shadow-inner lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile main">
            <p className="px-4 pb-1 text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
              {c.programs}
            </p>
            {c.items.map(([label, href]) => (
              <Link
                key={href + label}
                href={href}
                className="min-h-12 rounded-xl px-4 py-3 text-base font-semibold text-neutral-800 active:bg-neutral-100"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="my-2 border-t border-neutral-100" />
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="min-h-12 rounded-xl px-4 py-3 text-base font-semibold text-neutral-800 active:bg-neutral-100"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-700"
                onClick={() => setMenuOpen(false)}
              >
                {c.portal}
              </Link>
              <Link
                href="/#enquiry-form"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B5ED7] px-4 py-3 text-sm font-bold text-white"
                onClick={() => setMenuOpen(false)}
              >
                {c.enquiry}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
