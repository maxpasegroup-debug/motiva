"use client";

import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { TeacherBackLink } from "@/components/views/TeacherSubPageLayout";

export function TeacherUploadPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <TeacherBackLink />
      <h1 className="text-center text-2xl font-bold text-foreground sm:text-3xl">
        {t("teacher_nav_upload")}
      </h1>
      <Card className="p-10 text-center shadow-md">
        <p className="text-lg text-neutral-600">{t("coming_soon")}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t("teacher_upload_hint")}
        </p>
      </Card>
    </div>
  );
}
