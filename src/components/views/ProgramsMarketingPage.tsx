"use client";

import Link from "next/link";
import { getOfferingModeLabel, getOfferingsByBrand } from "@/lib/academy-offerings";
import { whatsappHref } from "@/components/marketing/whatsapp";

const brandText: Record<string, string> = {
  hmc: "Public speaking training through offline classes, Google Meet, WhatsApp support, and WPST recorded lessons.",
  motiva_edus: "Tuition, foundation support, madrassa tuition, and spoken English for students who need clear teaching.",
  nirvana: "Nirvana training programs with offline, online, and recorded learning options.",
};

export function ProgramsMarketingPage() {
  const groups = getOfferingsByBrand();

  return (
    <main className="w-full bg-white">
      <section className="border-b border-neutral-200 bg-neutral-950 px-4 py-14 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-200">
            Programs
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">
            HMC, Motiva Edus and Nirvana in one simple academy system
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/80">
            Select the brand, choose the program, and pick offline, online Google
            Meet, or recorded learning. The office team can handle enquiry,
            admission, fee, class, and student access from the same app.
          </p>
          <a
            href={whatsappHref("Hi MOTIVA, I want to know about your programs.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#25D366] px-5 text-sm font-bold text-white"
          >
            Ask on WhatsApp
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
        {groups.map((group) => (
          <article
            key={group.key}
            className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-950">
                  {group.name}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                  {brandText[group.key] ?? "Academy program"}
                </p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                {group.offerings.length} options
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {group.offerings.map((offering) => (
                <div
                  key={offering.key}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                >
                  <p className="text-base font-bold text-neutral-950">
                    {offering.programName}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {getOfferingModeLabel(offering.mode)}
                  </p>
                  <Link
                    href={`/#enquiry-form`}
                    className="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white"
                  >
                    Enquire
                  </Link>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
