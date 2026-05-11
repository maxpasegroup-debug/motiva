import type { ReactNode } from "react";

type FilterBarProps = {
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  children?: ReactNode;
};

export function FilterBar({
  searchValue = "",
  searchPlaceholder = "Search",
  onSearchChange,
  children,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <input
        value={searchValue}
        onChange={(event) => onSearchChange?.(event.target.value)}
        placeholder={searchPlaceholder}
        className="h-10 min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      {children ? <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
