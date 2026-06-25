import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BadgeIndianRupee,
  CalendarPlus,
  GraduationCap,
  MessageCircle,
  PhoneCall,
  UserPlus,
} from "lucide-react";

type QuickAction = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

const actions: QuickAction[] = [
  {
    title: "Add Enquiry",
    href: "/admin/leads",
    icon: PhoneCall,
    description: "Save a new family call.",
  },
  {
    title: "Approve Student",
    href: "/admin/admissions",
    icon: GraduationCap,
    description: "Confirm the student.",
  },
  {
    title: "Create Account",
    href: "/admin/admissions/create-account",
    icon: UserPlus,
    description: "Make student and parent login.",
  },
  {
    title: "Mark Fee",
    href: "/admin/payments",
    icon: BadgeIndianRupee,
    description: "Update paid or pending fee.",
  },
  {
    title: "Schedule Class",
    href: "/admin/batches",
    icon: CalendarPlus,
    description: "Check class or batch plan.",
  },
  {
    title: "Parents",
    href: "/admin/parents",
    icon: MessageCircle,
    description: "View parent contact details.",
  },
];

export function QuickActions() {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">Quick Actions</h2>
          <p className="mt-1 text-sm text-neutral-500">Common office work, one tap away.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group flex min-h-20 items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50"
          >
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-700 ring-1 ring-neutral-200 group-hover:text-blue-700">
              <action.icon className="h-4 w-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-neutral-900">
                {action.title}
              </span>
              <span className="mt-1 block text-xs leading-5 text-neutral-500">
                {action.description}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
