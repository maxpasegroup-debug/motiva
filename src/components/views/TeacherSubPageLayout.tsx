"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";

export function TeacherBackLink() {
  const { t } = useLanguage();
  return (
    <Link
      href="/teacher"
      className="inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
    >
      ← {t("teacher_back_dashboard")}
    </Link>
  );
}
