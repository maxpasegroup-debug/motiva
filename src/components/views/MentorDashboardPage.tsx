"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { RoleCoursesSection } from "@/components/courses/RoleCoursesSection";

export function MentorDashboardPage() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <h1 className="text-2xl font-bold text-foreground">{t("mentor_title")}</h1>
      <Card className="p-6 text-neutral-600 shadow-md">
        <p>{t("mentor_coming_soon")}</p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
          <li>{t("mentor_pool")}</li>
          <li>{t("mentor_class_mapping")}</li>
          <li>{t("mentor_teacher_allocation")}</li>
        </ul>
      </Card>
      <RoleCoursesSection role="mentor" heading="Courses" />
    </div>
  );
}
