"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { FadeInSection } from "@/components/ui/FadeInSection";

const IMG_WHY_BG =
  "https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=2000&q=80";

export function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="w-full bg-gradient-to-b from-slate-50 to-white">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#0B5ED7] via-[#1565C8] to-[#0d47a1] px-4 py-14 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-black/20"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            {t("about_title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/90 sm:text-lg">
            {t("about_intro")}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-4 py-12 sm:px-6 sm:py-16">
        <FadeInSection>
          <section className="grid gap-8 rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.12)] sm:grid-cols-2 sm:gap-12 sm:p-10">
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-blue-50 p-6 sm:p-8">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                {t("about_mission_title")}
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-neutral-700">
                {t("about_mission_text")}
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/80 p-6 sm:p-8">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">
                {t("about_vision_title")}
              </h2>
              <p className="mt-4 text-pretty leading-relaxed text-neutral-700">
                {t("about_vision_text")}
              </p>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <section
            className="overflow-hidden rounded-3xl border border-neutral-100 bg-gradient-to-b from-white to-blue-50/60 px-6 py-14 shadow-lg sm:px-10 sm:py-16"
            aria-labelledby="about-md-heading"
          >
            <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="order-2 flex flex-col text-center lg:order-1 lg:text-left">
                <div
                  className="mx-auto mb-4 h-1 w-10 rounded-full bg-orange-500 lg:mx-0"
                  aria-hidden
                />
                <h2
                  id="about-md-heading"
                  className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl"
                >
                  {t("md_section_title")}
                </h2>
                <blockquote className="mx-auto mt-4 max-w-xl border-l-4 border-orange-500 pl-4 text-left text-lg italic leading-relaxed text-gray-700 sm:text-xl lg:mx-0">
                  “{t("md_quote")}”
                </blockquote>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600 lg:mx-0">
                  {t("md_message")}
                </p>
              </div>

              <div className="order-1 lg:order-2">
                <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
                  <div className="relative aspect-[4/5] w-full max-h-[400px] overflow-hidden rounded-2xl shadow-2xl sm:max-h-[440px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/md.jpg"
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (!el.src.includes("unsplash")) {
                          el.src =
                            "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80";
                        }
                      }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-4 text-center text-xl font-semibold text-orange-500 lg:text-left">
                    {t("md_director_name")}
                  </p>
                  <p className="mt-1 text-center text-sm text-neutral-600 lg:text-left">
                    {t("about_founder_role")}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <section className="relative min-h-[220px] overflow-hidden rounded-3xl border border-neutral-200 py-14">
            <Image
              src={IMG_WHY_BG}
              alt=""
              fill
              className="object-cover opacity-[0.1]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-orange-50/30" />
            <div className="relative z-10 px-4 text-center sm:px-8">
              <p className="mx-auto max-w-2xl text-lg font-medium text-neutral-700">
                {t("about_closing")}
              </p>
              <Link
                href="/contact"
                className="mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#0B5ED7] to-[#3B82F6] px-8 text-base font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
              >
                {t("about_contact_cta")}
              </Link>
            </div>
          </section>
        </FadeInSection>

        <p className="pb-8 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            ← {t("back_home")}
          </Link>
        </p>
      </div>
    </div>
  );
}
