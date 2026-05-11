"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { ADMIN_NAVIGATION } from "@/lib/admin-navigation";

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

const commands = ADMIN_NAVIGATION.flatMap((group) =>
  group.items.flatMap((item) => [
    { title: item.title, href: item.href, group: group.title },
    ...(item.children ?? []).map((child) => ({
      title: child.title,
      href: child.href,
      group: item.title,
    })),
  ]),
);

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 10);
    return commands
      .filter((command) => `${command.group} ${command.title}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/35 px-4 pt-20">
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3">
          <Search className="h-5 w-5 text-neutral-400" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
            placeholder="Search admin pages"
            className="h-10 min-w-0 flex-1 text-sm outline-none"
          />
          <button
            type="button"
            aria-label="Close command palette"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.map((command, index) => (
            <Link
              key={`${command.href}-${index}`}
              href={command.href}
              onClick={onClose}
              className="block rounded-md px-3 py-2 hover:bg-neutral-100"
            >
              <span className="block text-sm font-medium text-neutral-950">{command.title}</span>
              <span className="block text-xs text-neutral-500">{command.group}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
