"use client";

import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n";

type Props = {
  titleKey: TranslationKey;
};

export function AdminSectionPage({ titleKey }: Props) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {t(titleKey)}
      </h1>
      <Card className="p-10 text-center shadow-md sm:p-12">
        <p className="text-lg text-neutral-600">{t("coming_soon")}</p>
      </Card>
    </div>
  );
}
