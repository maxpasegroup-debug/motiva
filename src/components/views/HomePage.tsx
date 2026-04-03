"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { FadeInSection } from "@/components/ui/FadeInSection";

/** Replace with your WhatsApp number (country code, no + or spaces). */
const WHATSAPP_HREF = "https://wa.me/919999999999";

/** Shown in landing trust line; swap for a real count from your data when ready. */
const LANDING_TRUSTED_STUDENT_COUNT = "100+";

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
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-10 text-center sm:px-6 sm:py-12">
      <section className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-b from-[#0B5ED7] via-[#6EC1FF] to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-28 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute bottom-[-120px] left-1/2 h-[26rem] w-[34rem] -translate-x-1/2 rounded-[100%] bg-[#0B5ED7]/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-12 px-5 py-12 sm:px-6 sm:py-16 md:flex-row md:items-center md:justify-between md:gap-14">
          <div className="w-full max-w-xl text-center md:text-left">
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              {t("landing_title")}
            </h1>
            <p className="mt-6 text-balance text-lg font-semibold text-white/90 sm:mt-5 sm:text-2xl">
              {t("landing_subtitle")}
            </p>

            <div className="mt-10 flex w-full flex-col gap-4 md:mt-8 md:flex-row md:items-center">
              <Button
                href="/login"
                icon={<span aria-hidden>👤</span>}
                className="w-full text-lg md:w-auto md:min-w-[12.5rem]"
              >
                {t("join_class")}
              </Button>
              <Button
                href="/login"
                variant="outline"
                icon={<span aria-hidden>→</span>}
                className="w-full text-lg md:w-auto md:min-w-[12.5rem]"
              >
                {t("login")}
              </Button>
            </div>
          </div>

          <div className="w-full max-w-md md:max-w-[22rem]">
            <div className="relative rounded-3xl bg-white/70 p-6 shadow-lg ring-1 ring-white/60">
              <svg
                viewBox="0 0 420 360"
                className="h-[18rem] w-full"
                role="img"
                aria-label="Student learning with teacher guidance"
              >
                <defs>
                  <linearGradient
                    id="g1"
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0" stopColor="#0B5ED7" stopOpacity="0.25" />
                    <stop offset="1" stopColor="#6EC1FF" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                <rect
                  x="24"
                  y="30"
                  width="372"
                  height="300"
                  rx="28"
                  fill="url(#g1)"
                />

                {/* Board */}
                <rect
                  x="250"
                  y="58"
                  width="120"
                  height="160"
                  rx="18"
                  fill="#ffffff"
                  opacity="0.9"
                />
                <path
                  d="M270 100 C290 80, 325 80, 347 100"
                  stroke="#0B5ED7"
                  strokeWidth="6"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.35"
                />

                {/* Teacher */}
                <circle cx="290" cy="175" r="22" fill="#0B5ED7" opacity="0.25" />
                <path
                  d="M275 206 Q290 190 305 206 L316 270 Q290 287 264 270 Z"
                  fill="#0B5ED7"
                  opacity="0.35"
                />
                {/* Teacher arm pointing */}
                <path
                  d="M296 220 L350 120"
                  stroke="#0B5ED7"
                  strokeWidth="7"
                  strokeLinecap="round"
                  opacity="0.55"
                />
                <circle cx="350" cy="120" r="9" fill="#0B5ED7" opacity="0.65" />

                {/* Student */}
                <circle cx="165" cy="185" r="20" fill="#0B5ED7" opacity="0.2" />
                <path
                  d="M145 215 Q165 200 185 215 L198 275 Q165 298 132 275 Z"
                  fill="#0B5ED7"
                  opacity="0.28"
                />

                {/* Book */}
                <path
                  d="M118 254 Q150 238 182 254 V288 Q150 272 118 288 Z"
                  fill="#ffffff"
                  opacity="0.9"
                />
                <path
                  d="M135 265 Q150 258 165 265"
                  stroke="#0B5ED7"
                  strokeWidth="4"
                  strokeLinecap="round"
                  opacity="0.35"
                  fill="none"
                />

                {/* Little sparkles */}
                <g opacity="0.45" fill="#0B5ED7">
                  <circle cx="210" cy="90" r="4" />
                  <circle cx="238" cy="115" r="3" />
                  <circle cx="186" cy="120" r="3" />
                  <circle cx="220" cy="145" r="2.5" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </section>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:mt-10 sm:text-sm sm:tracking-[0.18em]">
        {t("landing_trust_line").replace(
          "{count}",
          LANDING_TRUSTED_STUDENT_COUNT,
        )}
      </p>

      <FadeInSection>
        <section className="mx-auto w-full max-w-4xl py-16 sm:py-20">
        <h2 className="mb-12 text-center text-sm font-semibold uppercase tracking-widest text-neutral-500 sm:text-start">
          {t("services_title")}
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {(
            [
              {
                emoji: "🎯",
                titleKey: "service_one_to_one" as const,
                descKey: "service_one_to_one_desc" as const,
                circleClass: "bg-primary/12 ring-2 ring-primary/15",
              },
              {
                emoji: "👥",
                titleKey: "service_group" as const,
                descKey: "service_group_desc" as const,
                circleClass: "bg-primary/12 ring-2 ring-primary/15",
              },
              {
                emoji: "🎥",
                titleKey: "service_recorded" as const,
                descKey: "service_recorded_desc" as const,
                circleClass: "bg-accent/12 ring-2 ring-accent/25",
              },
            ] as const
          ).map(({ emoji, titleKey, descKey, circleClass }) => (
            <div
              key={titleKey}
              className="flex flex-col items-center gap-6 rounded-xl border border-neutral-100 bg-white px-6 py-10 text-center shadow-lg shadow-neutral-900/8 transition-all duration-200 ease-out sm:gap-5 sm:px-8 sm:py-8 motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-xl motion-safe:hover:shadow-neutral-900/12"
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl leading-none ${circleClass}`}
                aria-hidden
              >
                {emoji}
              </div>
              <h3 className="text-lg font-bold text-foreground sm:text-xl">
                {t(titleKey)}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-600 sm:text-base">
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>
      </FadeInSection>

      <FadeInSection>
        <section className="mx-auto w-full max-w-4xl py-16 sm:py-20">
        <h2 className="mb-12 text-center text-sm font-semibold uppercase tracking-widest text-neutral-500">
          {t("why_motiva_title")}
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {(
            [
              {
                emoji: "📘",
                titleKey: "why_motiva_simple" as const,
                shortKey: "why_motiva_simple_short" as const,
                circleClass: "bg-primary/10 ring-2 ring-primary/15",
              },
              {
                emoji: "🤝",
                titleKey: "why_motiva_guidance" as const,
                shortKey: "why_motiva_guidance_short" as const,
                circleClass: "bg-primary/10 ring-2 ring-primary/15",
              },
              {
                emoji: "📈",
                titleKey: "why_motiva_progress" as const,
                shortKey: "why_motiva_progress_short" as const,
                circleClass: "bg-accent/10 ring-2 ring-accent/20",
              },
            ] as const
          ).map(({ emoji, titleKey, shortKey, circleClass }) => (
            <div
              key={titleKey}
              className="flex flex-col items-center gap-5 rounded-2xl border border-neutral-100 bg-white/90 px-6 py-10 text-center shadow-md shadow-neutral-900/5 transition-all duration-200 ease-out sm:gap-4 sm:py-8 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg motion-safe:hover:shadow-neutral-900/10"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl leading-none ${circleClass}`}
                aria-hidden
              >
                {emoji}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  {t(titleKey)}
                </h3>
                <p className="text-sm leading-snug text-neutral-600">
                  {t(shortKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      </FadeInSection>

      <FadeInSection>
        <section className="mx-auto w-full max-w-3xl py-16 sm:py-20">
        <h2 className="mb-12 text-center text-sm font-semibold uppercase tracking-widest text-neutral-500 sm:text-start">
          {t("programs_title")}
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
          <Link
            href="/login"
            className="group relative flex min-h-[11rem] touch-manipulation flex-col items-stretch justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-accent via-accent/70 to-accent/10 px-8 py-12 text-center shadow-lg shadow-accent/15 transition-all duration-200 active:scale-[0.99] sm:min-h-0 sm:py-10 sm:text-left md:active:scale-100 hover:-translate-y-1.5 hover:shadow-xl"
          >
            <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-[-120px] h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="relative space-y-4 text-center sm:text-left">
              <div className="text-6xl font-extrabold tracking-tight text-white">
                12
              </div>
              <div className="text-2xl font-extrabold text-white">
                {t("program_12_desc")}
              </div>
              <div className="text-sm font-semibold text-white/90">
                {t("program_12_title")}
              </div>
            </div>
          </Link>

          <Link
            href="/login"
            className="group relative flex min-h-[11rem] touch-manipulation flex-col items-stretch justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-primary via-primary/60 to-primary/10 px-8 py-12 text-center shadow-lg shadow-primary/15 transition-all duration-200 ease-out active:scale-[0.99] sm:min-h-0 sm:py-10 sm:text-left md:active:scale-100 motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-xl"
          >
            <div className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-[-120px] h-72 w-72 rounded-full bg-white/15 blur-3xl" />
            <div className="relative space-y-4 text-center sm:text-left">
              <div className="text-6xl font-extrabold tracking-tight text-white">
                25
              </div>
              <div className="text-2xl font-extrabold text-white">
                {t("program_25_desc")}
              </div>
              <div className="text-sm font-semibold text-white/90">
                {t("program_25_title")}
              </div>
            </div>
          </Link>
        </div>
      </section>
      </FadeInSection>

      <FadeInSection>
        <footer className="mt-10 border-t border-neutral-200 pt-16 pb-12">
        <Link
          href={WHATSAPP_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-auto flex min-h-[3.25rem] w-full max-w-md touch-manipulation items-center justify-center gap-3 rounded-xl bg-[#25D366] px-6 text-center text-base font-semibold text-white shadow-sm transition-[transform,background-color,filter] duration-200 ease-out motion-safe:hover:scale-[1.02] hover:bg-[#20BD5A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] active:brightness-95 motion-safe:active:scale-[0.98]"
        >
          <WhatsAppIcon className="h-7 w-7 shrink-0" />
          {t("footer_whatsapp")}
        </Link>
        <p className="mx-auto mt-10 max-w-md text-sm text-neutral-500">
          {t("footer_line")}
        </p>
      </footer>
      </FadeInSection>
    </div>
  );
}
