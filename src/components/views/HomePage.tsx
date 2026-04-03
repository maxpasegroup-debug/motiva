"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { FadeInSection } from "@/components/ui/FadeInSection";

/** Replace with your WhatsApp number (country code, no + or spaces). */
const WHATSAPP_HREF = "https://wa.me/919999999999";

/** Shown in landing trust line; swap for a real count from your data when ready. */
const LANDING_TRUSTED_STUDENT_COUNT = "100+";

/** Unsplash — happy learning, teachers, students (high-quality editorial). */
const IMG_HERO =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=2400&q=85";
const IMG_HERO_FRAME =
  "https://images.unsplash.com/photo-1577896851237-aaefaca3aec0?auto=format&fit=crop&w=1200&q=85";
const IMG_SERVICES_SIDE =
  "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1000&q=85";
const IMG_WHY_BG =
  "https://images.unsplash.com/photo-1588072432836-100d6cfd522e?auto=format&fit=crop&w=2000&q=80";
const IMG_PROGRAM_12 =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae7732?auto=format&fit=crop&w=1400&q=85";
const IMG_PROGRAM_25 =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=85";

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

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="rgb(11 94 215 / 0.12)"
        stroke="rgb(11 94 215 / 0.35)"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 12.5l2.2 2.2L15.5 9"
        stroke="rgb(11 94 215)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HomePage() {
  const { t } = useLanguage();

  return (
    <>
      <section className="relative min-h-[min(92svh,40rem)] w-full overflow-hidden sm:min-h-[38rem]">
        <Image
          src={IMG_HERO}
          alt=""
          fill
          priority
          className="object-cover object-[center_30%]"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0B5ED7]/[0.72] via-[#1565C0]/[0.68] to-[#38BDF8]/[0.55]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0B5ED7]/50 via-transparent to-[#021a3a]/20"
          aria-hidden
        />

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-18 md:py-20">
          <h1 className="max-w-4xl text-balance text-4xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-5xl md:text-6xl">
            {t("landing_title")}
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg font-semibold leading-relaxed text-white/95 sm:mt-5 sm:text-2xl">
            {t("landing_subtitle")}
          </p>

          <div className="mt-10 flex w-full max-w-md flex-col items-stretch gap-4 sm:mt-12 sm:max-w-lg">
            <Button
              href="/login"
              icon={<span aria-hidden>👤</span>}
              className="min-h-16 w-full text-lg shadow-xl shadow-[#0B5ED7]/35 sm:text-xl"
            >
              {t("join_class")}
            </Button>
            <Button
              href="/login"
              variant="outline"
              icon={<span aria-hidden>→</span>}
              className="min-h-16 w-full !border-2 !border-white/90 !bg-white/10 !text-white !shadow-lg !shadow-black/20 backdrop-blur-sm hover:!border-white hover:!bg-white/20 hover:!text-white active:!bg-white/15 text-lg sm:text-xl focus-visible:!outline-white"
            >
              {t("login")}
            </Button>
          </div>

          <div className="relative mt-12 w-full max-w-lg sm:mt-14">
            <div className="relative aspect-[5/4] overflow-hidden rounded-3xl shadow-2xl shadow-black/25 ring-4 ring-white/35 ring-offset-4 ring-offset-transparent transition-transform duration-300 motion-safe:hover:scale-[1.01]">
              <Image
                src={IMG_HERO_FRAME}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 32rem"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#0B5ED7]/25 to-transparent"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-12 sm:px-6 sm:py-14">
        <p className="mx-auto max-w-2xl text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-sm sm:tracking-[0.18em]">
          {t("landing_trust_line").replace(
            "{count}",
            LANDING_TRUSTED_STUDENT_COUNT,
          )}
        </p>

        <FadeInSection>
          <section
            className="mt-14 rounded-3xl border border-neutral-200/80 bg-[#F8FAFC] px-6 py-20 shadow-sm shadow-neutral-900/[0.04] sm:mt-16"
            aria-labelledby="md-section-heading"
          >
            <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-14 lg:gap-16">
              <div className="order-2 flex flex-col text-center md:order-1 md:text-left">
                <div
                  className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#F26A2E] md:mx-0"
                  aria-hidden
                />
                <h2
                  id="md-section-heading"
                  className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl"
                >
                  {t("md_section_title")}
                </h2>
                <blockquote className="mt-2.5 border-none p-0 text-lg italic leading-relaxed text-neutral-700">
                  “{t("md_quote")}”
                </blockquote>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-600 md:mx-0">
                  {t("md_message")}
                </p>
              </div>

              <div className="order-1 md:order-2">
                <div className="relative mx-auto max-w-md md:mx-0 md:max-w-none">
                  <div
                    className="pointer-events-none absolute -inset-4 top-1/2 -z-10 h-[85%] -translate-y-1/2 rounded-[3rem] bg-gradient-to-br from-primary/35 via-[#6EC1FF]/25 to-[#F26A2E]/30 opacity-90 blur-3xl"
                    aria-hidden
                  />
                  <div
                    className="group relative overflow-hidden rounded-2xl shadow-2xl shadow-neutral-900/20 transition-[transform,box-shadow] duration-300 ease-out motion-safe:hover:scale-[1.03] motion-safe:hover:shadow-[0_28px_60px_-12px_rgba(15,23,42,0.35)]"
                  >
                    <div className="relative aspect-[4/5] w-full md:aspect-[3/4]">
                      <Image
                        src="/md.jpg"
                        alt={t("md_director_name")}
                        fill
                        className="h-full w-full object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
                        aria-hidden
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-center text-xl font-semibold text-orange-500">
                    {t("md_director_name")}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <section className="relative mt-14 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-[#E8F4FF] via-white to-[#F0F9FF] py-16 shadow-md shadow-primary/5 sm:mt-16 sm:py-20 md:py-24">
            <div
              className="pointer-events-none absolute -right-20 top-1/2 hidden h-[120%] w-1/2 -translate-y-1/2 opacity-[0.14] lg:block"
              aria-hidden
            >
              <Image
                src={IMG_SERVICES_SIDE}
                alt=""
                fill
                className="object-cover object-left"
                sizes="50vw"
              />
            </div>
            <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-8">
              <h2 className="mb-12 text-center text-sm font-bold uppercase tracking-[0.2em] text-primary/80 sm:text-start">
                {t("services_title")}
              </h2>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
                {(
                  [
                    {
                      emoji: "🎯",
                      titleKey: "service_one_to_one" as const,
                      descKey: "service_one_to_one_desc" as const,
                      circleClass:
                        "bg-gradient-to-br from-primary/20 to-[#6EC1FF]/25 ring-2 ring-primary/25 shadow-inner",
                    },
                    {
                      emoji: "👥",
                      titleKey: "service_group" as const,
                      descKey: "service_group_desc" as const,
                      circleClass:
                        "bg-gradient-to-br from-primary/15 to-accent/15 ring-2 ring-primary/20 shadow-inner",
                    },
                    {
                      emoji: "🎥",
                      titleKey: "service_recorded" as const,
                      descKey: "service_recorded_desc" as const,
                      circleClass:
                        "bg-gradient-to-br from-accent/25 to-[#FDBA74]/30 ring-2 ring-accent/30 shadow-inner",
                    },
                  ] as const
                ).map(({ emoji, titleKey, descKey, circleClass }) => (
                  <div
                    key={titleKey}
                    className="flex flex-col items-center gap-5 rounded-xl border border-white/80 bg-white px-6 py-10 text-center shadow-md shadow-neutral-900/[0.06] transition-all duration-200 ease-out ring-1 ring-neutral-100/80 sm:gap-5 sm:px-7 sm:py-9 motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-lg motion-safe:hover:shadow-primary/10"
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
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <section className="relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl border border-neutral-200/80 py-16 shadow-lg shadow-neutral-900/[0.06] sm:mt-16 sm:py-20 md:py-24">
            <Image
              src={IMG_WHY_BG}
              alt=""
              fill
              className="object-cover opacity-[0.12]"
              sizes="100vw"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-[#FFF8F0]/90"
              aria-hidden
            />
            <div className="relative z-10 px-4 sm:px-8">
              <h2 className="mb-12 text-center text-sm font-bold uppercase tracking-[0.2em] text-neutral-600">
                {t("why_motiva_title")}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                {(
                  [
                    "why_point_personal",
                    "why_point_expert",
                    "why_point_structured",
                    "why_point_friendly",
                  ] as const
                ).map((key) => (
                  <div
                    key={key}
                    className="flex flex-col items-center gap-5 rounded-2xl border border-neutral-100/90 bg-white/90 px-6 py-9 text-center shadow-md shadow-neutral-900/[0.05] backdrop-blur-sm transition-all duration-200 ease-out motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg"
                  >
                    <CheckCircleIcon className="h-14 w-14 shrink-0" />
                    <p className="text-base font-bold leading-snug text-foreground sm:text-lg">
                      {t(key)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <section className="relative mx-auto mt-14 max-w-3xl py-16 sm:mt-16 sm:py-20 md:py-24">
            <div
              className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-[#E0F2FE]/80 via-white to-[#FFEDD5]/50"
              aria-hidden
            />
            <h2 className="mb-12 text-center text-sm font-bold uppercase tracking-[0.2em] text-neutral-600 sm:text-start">
              {t("programs_title")}
            </h2>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-6">
              <Link
                href="/login"
                className="group relative flex min-h-[13rem] touch-manipulation flex-col items-stretch justify-center overflow-hidden rounded-3xl px-8 py-12 text-center shadow-xl shadow-accent/20 transition-all duration-200 ease-out active:scale-[0.99] sm:min-h-[12rem] sm:py-10 sm:text-left md:active:scale-100 motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-2xl"
              >
                <Image
                  src={IMG_PROGRAM_12}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-accent/88 via-accent/72 to-[#FDBA74]/75"
                  aria-hidden
                />
                <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 bottom-[-100px] h-64 w-64 rounded-full bg-white/15 blur-3xl" />
                <div className="relative z-10 space-y-4 text-center sm:text-left">
                  <div className="text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
                    12
                  </div>
                  <div className="text-2xl font-extrabold text-white drop-shadow-sm">
                    {t("program_12_desc")}
                  </div>
                  <div className="text-sm font-semibold text-white/95">
                    {t("program_12_title")}
                  </div>
                </div>
              </Link>

              <Link
                href="/login"
                className="group relative flex min-h-[13rem] touch-manipulation flex-col items-stretch justify-center overflow-hidden rounded-3xl px-8 py-12 text-center shadow-xl shadow-primary/20 transition-all duration-200 ease-out active:scale-[0.99] sm:min-h-[12rem] sm:py-10 sm:text-left md:active:scale-100 motion-safe:hover:-translate-y-1.5 motion-safe:hover:scale-[1.02] motion-safe:hover:shadow-2xl"
              >
                <Image
                  src={IMG_PROGRAM_25}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-b from-primary/88 via-primary/68 to-[#6EC1FF]/70"
                  aria-hidden
                />
                <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 bottom-[-100px] h-64 w-64 rounded-full bg-white/15 blur-3xl" />
                <div className="relative z-10 space-y-4 text-center sm:text-left">
                  <div className="text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
                    25
                  </div>
                  <div className="text-2xl font-extrabold text-white drop-shadow-sm">
                    {t("program_25_desc")}
                  </div>
                  <div className="text-sm font-semibold text-white/95">
                    {t("program_25_title")}
                  </div>
                </div>
              </Link>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <footer className="mt-14 border-t border-neutral-200/90 pt-16 pb-14 sm:mt-16">
            <Link
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto flex min-h-[3.25rem] w-full max-w-md touch-manipulation items-center justify-center gap-3 rounded-xl bg-[#25D366] px-6 text-center text-base font-semibold text-white shadow-md shadow-neutral-900/10 transition-[transform,background-color,filter,box-shadow] duration-200 ease-out hover:bg-[#20BD5A] hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366] active:brightness-95 motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]"
            >
              <WhatsAppIcon className="h-7 w-7 shrink-0" />
              {t("footer_whatsapp")}
            </Link>
            <p className="mx-auto mt-10 max-w-md text-center text-sm text-neutral-500">
              {t("footer_line")}
            </p>
          </footer>
        </FadeInSection>
      </div>
    </>
  );
}
