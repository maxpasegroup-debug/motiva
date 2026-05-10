import en from "../../translations/en.json";

export type Locale = "en";

export const STORAGE_KEY = "motiva-lang";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
};

export type TranslationKey = keyof typeof en;

export const messages: Record<Locale, typeof en> = {
  en,
};
