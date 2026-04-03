"use client";

import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function AdminSettingsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {t("admin_settings_title")}
        </h1>
        <p className="mt-2 text-lg text-neutral-600">{t("admin_settings_sub")}</p>
      </div>
      <Card className="border-2 border-neutral-200/80 p-8">
        <p className="text-lg leading-relaxed text-neutral-700">
          {t("admin_settings_password_hint")}
        </p>
        <p className="mt-6 text-base text-neutral-600">{t("admin_settings_admin_boot")}</p>
      </Card>
    </div>
  );
}
