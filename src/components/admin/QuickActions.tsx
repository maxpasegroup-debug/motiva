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
    title: "Add Lead",
    href: "/admin/leads",
    icon: PhoneCall,
    description: "Capture a new enquiry or callback.",
  },
  {
    title: "Approve Admission",
    href: "/admin/admissions",
    icon: GraduationCap,
    description: "Move a student into a batch.",
  },
  {
    title: "Create Account",
    href: "/admin/admissions/create-account",
    icon: UserPlus,
    description: "Generate student and parent login.",
  },
  {
    title: "Mark Payment",
    href: "/admin/payments",
    icon: BadgeIndianRupee,
    description: "Update fee collection status.",
  },
  {
    title: "Schedule Class",
    href: "/admin/batches",
    icon: CalendarPlus,
    description: "Review class and batch plan.",
  },
  {
    title: "Send Message",
    href: "/admin/parents",
    icon: MessageCircle,
    description: "Reach parent or student quickly.",
  },
];

export function QuickActions() {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">Quick Actions</h2>
          <p className="mt-1 text-sm text-neutral-500">Common academy operations.</p>
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
