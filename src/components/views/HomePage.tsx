"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/** Replace with your WhatsApp number (country code, no + or spaces). */
const WHATSAPP_HREF = "https://wa.me/919999999999";

function LogInIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" x2="3" y1="12" y2="12" />
    </svg>
  );
}

function UserRoundIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UsersIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PlayCircleIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}

function CalendarIcon({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function WhatsAppIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-8 text-center sm:px-6 sm:py-10">
      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 pb-16 pt-4 sm:pb-20 sm:pt-6">
        <div className="space-y-4">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t("landing_title")}
          </h1>
          <p className="text-balance text-lg text-neutral-600 sm:text-xl">
            {t("landing_subtitle")}
          </p>
        </div>
        <div className="flex w-full max-w-md flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            href="/login"
            icon={<UserRoundIcon className="h-6 w-6" />}
            className="sm:min-w-[12rem]"
          >
            {t("join_class")}
          </Button>
          <Button
            href="/login"
            variant="outline"
            icon={<LogInIcon />}
            className="sm:min-w-[12rem]"
          >
            {t("login")}
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl py-14 sm:py-16">
        <h2 className="mb-10 text-sm font-semibold uppercase tracking-widest text-neutral-500">
          {t("services_title")}
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {(
            [
              {
                icon: (
                  <UserRoundIcon className="mx-auto h-10 w-10 text-primary" />
                ),
                titleKey: "service_one_to_one" as const,
                descKey: "service_one_to_one_desc" as const,
              },
              {
                icon: (
                  <UsersIcon className="mx-auto h-10 w-10 text-primary" />
                ),
                titleKey: "service_group" as const,
                descKey: "service_group_desc" as const,
              },
              {
                icon: (
                  <PlayCircleIcon className="mx-auto h-10 w-10 text-accent" />
                ),
                titleKey: "service_recorded" as const,
                descKey: "service_recorded_desc" as const,
              },
            ] as const
          ).map(({ icon, titleKey, descKey }) => (
            <Card
              key={titleKey}
              className="flex flex-col items-center gap-4 text-center"
            >
              {icon}
              <h3 className="text-lg font-semibold text-foreground">
                {t(titleKey)}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-600">
                {t(descKey)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl py-14 sm:py-16">
        <h2 className="mb-10 text-sm font-semibold uppercase tracking-widest text-neutral-500">
          {t("programs_title")}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Card className="border-2 border-primary/25 bg-primary/[0.03] py-10 sm:min-h-[200px] sm:py-12">
            <CalendarIcon className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-5 text-2xl font-bold text-foreground sm:text-3xl">
              {t("program_12_title")}
            </h3>
            <p className="mt-3 text-sm text-neutral-600 sm:text-base">
              {t("program_12_desc")}
            </p>
          </Card>
          <Card className="border-2 border-accent/30 bg-accent/[0.04] py-10 sm:min-h-[200px] sm:py-12">
            <CalendarIcon className="mx-auto h-10 w-10 text-accent" />
            <h3 className="mt-5 text-2xl font-bold text-foreground sm:text-3xl">
              {t("program_25_title")}
            </h3>
            <p className="mt-3 text-sm text-neutral-600 sm:text-base">
              {t("program_25_desc")}
            </p>
          </Card>
        </div>
      </section>

      <footer className="mt-6 border-t border-neutral-200 pt-14 pb-8">
        <Link
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto flex min-h-14 w-full max-w-md items-center justify-center gap-3 rounded-xl bg-[#25D366] px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#20BD5A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
        >
          <WhatsAppIcon className="h-7 w-7 shrink-0" />
          {t("footer_whatsapp")}
        </Link>
        <p className="mx-auto mt-8 max-w-md text-sm text-neutral-500">
          {t("footer_line")}
        </p>
      </footer>
    </div>
  );
}
