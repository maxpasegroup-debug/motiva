"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n";

type Props = {
  titleKey: TranslationKey;
  emoji: string;
};

export function DashboardSubPage({ titleKey, emoji }: Props) {
  const { t } = useLanguage();

  return (
    <div className="space-y-10">
      <Card className="flex flex-col items-center px-6 py-14 text-center shadow-lg sm:py-16">
        <span className="text-6xl leading-none sm:text-7xl" aria-hidden>
          {emoji}
        </span>
        <h1 className="mt-6 text-2xl font-bold text-foreground sm:text-3xl">
          {t(titleKey)}
        </h1>
        <p className="mt-3 text-neutral-600">{t("coming_soon")}</p>
      </Card>

      <p className="text-center">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-primary underline-offset-4 hover:underline"
        >
          ← {t("back")}
        </Link>
      </p>
    </div>
  );
}
