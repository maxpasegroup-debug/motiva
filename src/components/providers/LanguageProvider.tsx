"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import {
  type Locale,
  messages,
  STORAGE_KEY,
  type TranslationKey,
} from "@/lib/i18n";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale: Locale = "en";

  const setLocale = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "en");
      document.documentElement.lang = "en";
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey) =>
      messages.en[key] ?? String(key),
    [],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
