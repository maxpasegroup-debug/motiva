import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  /** When false, skips hover lift (e.g. dashed empty states). Default true. */
  interactive?: boolean;
};

export function Card({
  children,
  className = "",
  interactive = true,
}: CardProps) {
  const lift = interactive ? "motion-safe:hover:-translate-y-0.5" : "";
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-transform duration-200 ease-out ${lift} ${className}`}
    >
      {children}
    </div>
  );
}
