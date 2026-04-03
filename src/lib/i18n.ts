import en from "../../translations/en.json";
import ml from "../../translations/ml.json";

export type Locale = "en" | "ml";

export const STORAGE_KEY = "motiva-lang";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  ml: "മലയാളം",
};

export type TranslationKey = keyof typeof en;

export const messages: Record<Locale, typeof en> = {
  en,
  ml,
};
