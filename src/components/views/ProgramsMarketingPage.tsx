"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { FadeInSection } from "@/components/ui/FadeInSection";
import { whatsappHref } from "@/components/marketing/whatsapp";

type Offering = {
  id: string;
  titleKey:
    | "prog_offer_one_to_one_title"
    | "prog_offer_remedial_title"
    | "prog_offer_parenting_title"
    | "prog_offer_happiness_title"
    | "prog_offer_career_title";
  descKey:
    | "prog_offer_one_to_one_desc"
    | "prog_offer_remedial_desc"
    | "prog_offer_parenting_desc"
    | "prog_offer_happiness_desc"
    | "prog_offer_career_desc";
  image: string;
};

const OFFERINGS: Offering[] = [
  {
    id: "one-to-one",
    titleKey: "prog_offer_one_to_one_title",
    descKey: "prog_offer_one_to_one_desc",
    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "remedial",
    titleKey: "prog_offer_remedial_title",
    descKey: "prog_offer_remedial_desc",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "parenting",
    titleKey: "prog_offer_parenting_title",
    descKey: "prog_offer_parenting_desc",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "happiness",
    titleKey: "prog_offer_happiness_title",
    descKey: "prog_offer_happiness_desc",
    image:
      "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: "career",
    titleKey: "prog_offer_career_title",
    descKey: "prog_offer_career_desc",
    image:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85",
  },
];

export function ProgramsMarketingPage() {
  const { t } = useLanguage();

  return (
    <div className="w-full bg-gradient-to-b from-slate-50 via-white to-blue-50/40">
      <section className="relative overflow-hidden border-b border-white/20 bg-gradient-to-br from-[#0B5ED7] via-[#1565C8] to-[#0d47a1] px-4 py-14 sm:py-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:40px_40px]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            {t("programs_page_hero_title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-white/88 sm:text-lg">
            {t("programs_page_hero_sub")}
          </p>
          <a
            href={whatsappHref(t("programs_page_hero_whatsapp_prefill"))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#25D366] px-8 text-base font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-[#20BD5A] motion-safe:hover:scale-[1.02]"
          >
            {t("programs_page_hero_cta")}
          </a>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-12 sm:space-y-10 sm:px-6 sm:py-16">
        {OFFERINGS.map((item, i) => (
          <FadeInSection key={item.id}>
            <article
              className={`overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.15)] transition-shadow duration-300 hover:shadow-[0_28px_60px_-20px_rgba(11,94,215,0.18)] ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              } flex flex-col md:flex-row`}
            >
              <div className="relative aspect-[4/3] w-full shrink-0 md:aspect-auto md:w-1/2 md:min-h-[280px]">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black/20"
                  aria-hidden
                />
              </div>
              <div className="flex flex-1 flex-col justify-center p-6 sm:p-10">
                <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
                  {t(item.titleKey)}
                </h2>
                <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-600 sm:text-lg">
                  {t(item.descKey)}
                </p>
                <a
                  href={whatsappHref(
                    t("programs_offer_whatsapp_prefill").replace(
                      "{program}",
                      t(item.titleKey),
                    ),
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex min-h-14 w-full max-w-xs touch-manipulation items-center justify-center rounded-2xl bg-[#25D366] px-6 text-center text-base font-bold text-white shadow-md transition-all hover:bg-[#20BD5A] motion-safe:hover:scale-[1.02] sm:w-auto"
                >
                  {t("programs_offer_whatsapp_cta")}
                </a>
              </div>
            </article>
          </FadeInSection>
        ))}

        <p className="pt-4 text-center">
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
