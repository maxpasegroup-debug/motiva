"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { type Role } from "@/lib/roles";
import { getSession } from "@/lib/session";
import type { TranslationKey } from "@/lib/i18n";

const ROLE_LABEL_KEYS: Record<Role, TranslationKey> = {
  admin: "role_admin",
  telecounselor: "role_telecounselor",
  demo_executive: "role_demo_executive",
  mentor: "role_mentor",
  teacher: "role_teacher",
  student: "role_student",
  parent: "role_parent",
  public: "role_public",
};

export function RoleSwitcher() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState<Role | null>(null);

  useEffect(() => {
    setCurrent(getSession()?.role ?? null);
  }, []);

  if (!current) return null;

  return (
    <div
      className="rounded-xl border border-dashed border-accent/40 bg-accent/5 px-3 py-3"
      aria-label={t("role_switch_aria")}
    >
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-neutral-500">
        {t("role_switch_label")}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <span className="min-h-11 rounded-lg px-4 py-2 text-sm font-semibold bg-primary text-white shadow-sm">
          {t(ROLE_LABEL_KEYS[current])}
        </span>
      </div>
    </div>
  );
}
