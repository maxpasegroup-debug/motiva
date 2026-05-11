import type { LucideIcon } from "lucide-react";

type StatsCardProps = {
  label: string;
  value: string;
  helper?: string;
  trend?: string;
  tone?: "blue" | "green" | "orange" | "neutral" | "red";
  icon: LucideIcon;
};

const toneClasses = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  orange: "bg-orange-50 text-orange-700 ring-orange-100",
  neutral: "bg-neutral-100 text-neutral-700 ring-neutral-200",
  red: "bg-red-50 text-red-700 ring-red-100",
};

export function StatsCard({
  label,
  value,
  helper,
  trend,
  tone = "neutral",
  icon: Icon,
}: StatsCardProps) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-neutral-950">
            {value}
          </p>
        </div>
        <span
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 ${toneClasses[tone]}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
      <div className="mt-4 flex min-h-5 items-center justify-between gap-2 text-xs">
        <span className="truncate text-neutral-500">{helper}</span>
        {trend ? (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-1 font-medium text-neutral-700">
            {trend}
          </span>
        ) : null}
      </div>
    </section>
  );
}
