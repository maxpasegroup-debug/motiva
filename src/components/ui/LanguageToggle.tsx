"use client";

import { LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className="flex shrink-0 items-center rounded-lg border border-neutral-200 bg-neutral-50 p-1 text-sm font-semibold"
      role="group"
      aria-label="Language"
    >
      {(["en", "ml"] as Locale[]).map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            className={`rounded-md px-3 py-2 transition-colors ${
              active
                ? "bg-primary text-white shadow-sm"
                : "text-neutral-600 hover:bg-white"
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
