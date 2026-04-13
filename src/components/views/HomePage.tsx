"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { whatsappHref } from "@/components/marketing/whatsapp";
import { FadeInSection } from "@/components/ui/FadeInSection";

const LANDING_TRUSTED_STUDENT_COUNT = "100+";

const IMG_HERO_STUDENT =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=88";
const IMG_SERVICES_SIDE =
  "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1000&q=85";
const IMG_WHY_BG =
  "https://images.unsplash.com/photo-1588072432836-100d6cfd522e?auto=format&fit=crop&w=2000&q=80";

export type LandingProgram = {
  id: string;
  title: string;
  description: string;
  image_path: string;
};

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
  const [programs, setPrograms] = useState<LandingProgram[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/programs")
      .then((res) => res.json())
      .then((json: { programs?: LandingProgram[] }) => {
        if (!cancelled) setPrograms(json.programs ?? []);
      })
      .catch(() => {
        if (!cancelled) setPrograms([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-[#062a63] via-[#0B5ED7] to-[#5DB3F5]">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:40px_40px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-blue-300/15 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:py-24">
          <div className="max-w-xl text-center lg:text-left">
            <h1 className="text-balance text-3xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[2.75rem]">
              {t("hero_heading")}
            </h1>
            <p className="mt-5 text-pretty text-lg font-medium leading-relaxed text-white/92 sm:mt-6 sm:text-xl">
              {t("hero_subtext")}
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Link
                href="/programs"
                className="inline-flex min-h-14 w-full touch-manipulation items-center justify-center rounded-2xl bg-white px-8 text-base font-bold text-[#0B5ED7] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] transition-all duration-200 hover:bg-blue-50 motion-safe:hover:scale-[1.02] sm:w-auto sm:min-w-[12rem]"
              >
                {t("hero_explore_programs")}
              </Link>
              <a
                href={whatsappHref(t("hero_whatsapp_prefill"))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 w-full touch-manipulation items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-8 text-base font-bold text-white shadow-[0_12px_40px_-12px_rgba(37,211,102,0.45)] transition-all duration-200 hover:bg-[#20BD5A] motion-safe:hover:scale-[1.02] sm:w-auto sm:min-w-[12rem]"
              >
                <WhatsAppIcon className="h-6 w-6 shrink-0" />
                {t("hero_whatsapp")}
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-white/25 to-transparent opacity-60 blur-2xl"
              aria-hidden
            />
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] shadow-[0_32px_64px_-20px_rgba(0,0,0,0.45)] ring-2 ring-white/25 sm:aspect-[5/6] lg:aspect-[4/5]">
              <Image
                src={IMG_HERO_STUDENT}
                alt=""
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 90vw, 45vw"
                priority
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#062a63]/70 via-transparent to-[#062a63]/20"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-12 sm:px-6 sm:py-14">
        <p className="mx-auto max-w-2xl text-center text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 sm:text-sm">
          {t("landing_trust_line").replace(
            "{count}",
            LANDING_TRUSTED_STUDENT_COUNT,
          )}
        </p>

        <FadeInSection>
          <section className="relative mt-14 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-[#E8F4FF] via-white to-[#F0F9FF] py-14 shadow-[0_24px_60px_-28px_rgba(11,94,215,0.2)] sm:mt-16 sm:py-16 md:py-20">
            <div
              className="pointer-events-none absolute -right-24 top-1/2 hidden h-[130%] w-[55%] -translate-y-1/2 opacity-[0.18] lg:block"
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
              <h2 className="mb-10 text-center text-sm font-bold uppercase tracking-[0.2em] text-primary/85 sm:mb-12 sm:text-start">
                {t("services_title")}
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
                {(
                  [
                    {
                      emoji: "🎯",
                      titleKey: "service_one_to_one" as const,
                      descKey: "service_one_to_one_desc" as const,
                      circleClass:
                        "bg-gradient-to-br from-primary/25 to-[#6EC1FF]/30 ring-2 ring-primary/30 shadow-inner",
                    },
                    {
                      emoji: "👥",
                      titleKey: "service_group" as const,
                      descKey: "service_group_desc" as const,
                      circleClass:
                        "bg-gradient-to-br from-primary/18 to-accent/20 ring-2 ring-primary/25 shadow-inner",
                    },
                  ] as const
                ).map(({ emoji, titleKey, descKey, circleClass }) => (
                  <div
                    key={titleKey}
                    className="flex flex-col items-center gap-5 rounded-2xl border border-white/90 bg-white/95 px-6 py-12 text-center shadow-lg shadow-neutral-900/[0.08] ring-1 ring-neutral-100/90 transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl motion-safe:hover:shadow-primary/10"
                  >
                    <div
                      className={`flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl text-4xl leading-none ${circleClass}`}
                      aria-hidden
                    >
                      {emoji}
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      {t(titleKey)}
                    </h3>
                    <p className="max-w-sm text-base leading-relaxed text-neutral-600">
                      {t(descKey)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <section className="relative mx-auto mt-14 max-w-4xl overflow-hidden rounded-3xl border border-neutral-200/80 py-16 shadow-[0_24px_50px_-24px_rgba(15,23,42,0.12)] sm:mt-16 sm:py-20 md:py-24">
            <Image
              src={IMG_WHY_BG}
              alt=""
              fill
              className="object-cover opacity-[0.12]"
              sizes="100vw"
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-white via-white/96 to-[#FFF8F0]/92"
              aria-hidden
            />
            <div className="relative z-10 px-4 sm:px-8">
              <h2 className="mb-10 text-center text-sm font-bold uppercase tracking-[0.2em] text-neutral-600 sm:mb-12">
                {t("why_motiva_title")}
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
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
                    className="flex flex-col items-center gap-4 rounded-2xl border border-neutral-100/95 bg-white/95 px-5 py-9 text-center shadow-md shadow-neutral-900/[0.06] backdrop-blur-sm transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg"
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
          <section
            id="programs"
            className="relative mx-auto mt-14 max-w-7xl scroll-mt-24 px-0 py-14 sm:mt-16 sm:scroll-mt-28 sm:py-16 md:py-20"
          >
            <div
              className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-[#E0F2FE]/90 via-white to-[#FFEDD5]/45"
              aria-hidden
            />
            <h2 className="mb-8 px-1 text-center text-sm font-bold uppercase tracking-[0.2em] text-neutral-600 sm:mb-10 sm:text-start">
              {t("programs_title")}
            </h2>
            {programs === null ? (
              <p className="py-12 text-center text-lg font-medium text-neutral-500">
                {t("landing_programs_loading")}
              </p>
            ) : programs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-neutral-300 bg-white/90 px-6 py-16 text-center shadow-inner">
                <p className="text-lg font-medium text-neutral-500">
                  {t("landing_programs_empty")}
                </p>
                <Link
                  href="/programs"
                  className="mt-6 inline-flex min-h-14 items-center justify-center rounded-2xl bg-primary px-8 font-bold text-white"
                >
                  {t("hero_explore_programs")}
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {programs.map((program) => (
                  <article
                    key={program.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.15)] transition-all duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_28px_60px_-24px_rgba(11,94,215,0.2)]"
                  >
                    <div className="relative aspect-[16/11] w-full overflow-hidden">
                      {program.image_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={program.image_path}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                        />
                      ) : (
                        <div
                          className="h-full w-full bg-gradient-to-br from-neutral-600 to-neutral-900"
                          aria-hidden
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h3 className="text-xl font-bold text-neutral-900">
                        {program.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-neutral-600">
                        {program.description}
                      </p>
                      <a
                        href={whatsappHref(
                          t("programs_enquire_prefill").replace(
                            "{title}",
                            program.title,
                          ),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-xl bg-[#25D366] text-center text-base font-bold text-white shadow-md transition-all hover:bg-[#20BD5A] motion-safe:hover:scale-[1.01]"
                      >
                        {t("programs_enquire_now")}
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="mt-10 flex justify-center sm:justify-start">
              <Link
                href="/programs"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-primary bg-white px-8 text-base font-bold text-primary shadow-md transition-all hover:bg-primary/5"
              >
                {t("programs_view_all")}
              </Link>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <footer className="mt-14 border-t border-neutral-200/90 pt-14 pb-12 sm:mt-16 sm:pt-16">
            <a
              href={whatsappHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto flex min-h-[3.5rem] w-full max-w-md touch-manipulation items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-6 text-center text-base font-bold text-white shadow-[0_12px_32px_-8px_rgba(37,211,102,0.4)] transition-all hover:bg-[#20BD5A] motion-safe:hover:scale-[1.02]"
            >
              <WhatsAppIcon className="h-7 w-7 shrink-0" />
              {t("footer_whatsapp")}
            </a>
            <p className="mx-auto mt-10 max-w-md text-center text-sm text-neutral-500">
              {t("footer_line")}
            </p>
          </footer>
        </FadeInSection>
      </div>
    </>
  );
}
