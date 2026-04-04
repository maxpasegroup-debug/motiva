"use client";

import { LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { useLanguage } from "@/components/providers/LanguageProvider";

type Props = {
  variant?: "default" | "header" | "compact";
};

export function LanguageToggle({ variant = "default" }: Props) {
  const { locale, setLocale } = useLanguage();

  const codes = ["en", "ml"] as Locale[];

  if (variant === "compact") {
    return (
      <div
        className="inline-flex shrink-0 items-center gap-1"
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
              className={`touch-manipulation rounded-full px-2.5 py-1 text-xs font-semibold transition-[transform,background-color,color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 motion-safe:active:scale-[0.98] ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-100 text-gray-700 hover:bg-neutral-200"
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

  if (variant === "header") {
    return (
      <div
        className="inline-flex shrink-0 items-center gap-2"
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
              className={`min-h-11 min-w-[2.75rem] touch-manipulation rounded-full px-3 py-2 text-sm font-semibold transition-[transform,background-color,color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 motion-safe:active:scale-[0.98] ${
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-neutral-100 text-gray-700 hover:bg-neutral-200"
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
