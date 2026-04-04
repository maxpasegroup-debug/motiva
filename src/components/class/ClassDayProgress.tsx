"use client";

import { useLanguage } from "@/components/providers/LanguageProvider";

export type DayProgressSnapshot = {
  duration: 12 | 25;
  unlockedDay: number;
  completedDays: number;
};

type Props = {
  snapshot: DayProgressSnapshot;
};

export function ClassDayProgress({ snapshot }: Props) {
  const { t } = useLanguage();

  // Show the full timeline for both teacher and student:
  // ✅ completed, 🔓 unlocked (watchable), 🔒 locked.
  const dayNumbers = Array.from(
    { length: snapshot.duration },
    (_, i) => i + 1,
  );

  return (
    <ul className="space-y-4">
      {dayNumbers.map((day) => {
        const done = day <= snapshot.completedDays;
        const locked = day > snapshot.unlockedDay;

        let icon: string;
        if (done) icon = "✅";
        else if (locked) icon = "🔒";
        else icon = "🔓";

        return (
          <li key={day}>
            <div className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-md sm:min-h-[4.25rem] sm:px-6">
              <span className="text-lg font-semibold text-foreground sm:text-xl">
                {t("class_day")} {day}
              </span>
              <span className="text-3xl leading-none" aria-hidden>
                {icon}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
