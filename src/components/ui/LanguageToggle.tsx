"use client";

import { LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  const codes = ["en", "ml"] as Locale[];

  return (
    <div
      className="inline-flex shrink-0 items-center gap-3 sm:gap-4"
      role="group"
      aria-label="Language"
    >
      {codes.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`min-h-11 min-w-[2.75rem] rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              active
                ? "bg-primary text-white shadow-sm shadow-primary/25"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-100"
            }`}
            aria-pressed={active}
          >
            {LOCALE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
