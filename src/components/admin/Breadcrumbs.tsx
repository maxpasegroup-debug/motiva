"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getAdminBreadcrumbs } from "@/lib/admin-navigation";

export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = getAdminBreadcrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
      <Link href="/admin/dashboard" className="shrink-0 text-neutral-500 hover:text-neutral-900">
        Admin
      </Link>
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1;
        return (
          <span key={`${crumb.href}-${index}`} className="flex min-w-0 items-center gap-1">
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
            {last ? (
              <span className="truncate font-medium text-neutral-900">{crumb.title}</span>
            ) : (
              <Link href={crumb.href} className="truncate text-neutral-500 hover:text-neutral-900">
                {crumb.title}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
