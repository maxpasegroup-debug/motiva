import type { ReactNode } from "react";

type SidebarSectionProps = {
  title: string;
  children: ReactNode;
};

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <section>
      <h2 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {title}
      </h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}
