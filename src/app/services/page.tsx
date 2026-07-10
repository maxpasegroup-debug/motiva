import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { whatsappHref } from "@/components/marketing/whatsapp";

export const metadata: Metadata = {
  title: "Services - Motiva Edus",
  description:
    "Explore Motiva Edus tuition, remedial, spoken English, madrassa, public speaking, and recorded learning services.",
};

const services = [
  {
    id: "foundation",
    title: "Foundation / Remedial",
    subtitle: "For students who missed basics and need a patient rebuild.",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=84",
    points: ["12 day and 25 day plans", "Gap check before classes", "Progress notes for parents"],
  },
  {
    id: "tuition",
    title: "One-to-One Tuition",
    subtitle: "Personal teacher support for school subjects and exam confidence.",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=84",
    points: ["Online or offline support", "Matched teacher", "Parent follow-up"],
  },
  {
    id: "spoken-english",
    title: "Spoken English",
    subtitle: "Confidence, fluency, and practical speaking practice.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=84",
    points: ["Speaking practice", "Public confidence", "Correction and feedback"],
  },
  {
    id: "madrassa",
    title: "Madrassa Tuition",
    subtitle: "Structured support for madrassa learning and regular practice.",
    image:
      "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=84",
    points: ["Regular learning plan", "Teacher guidance", "Parent visibility"],
  },
  {
    id: "public-speaking",
    title: "Public Speaking",
    subtitle: "Stage confidence and communication training through HMC programs.",
    image:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=84",
    points: ["Confidence tasks", "Voice and clarity", "Presentation practice"],
  },
  {
    id: "recorded",
    title: "Recorded Courses",
    subtitle: "Self-paced lessons for students who want flexible learning.",
    image:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=84",
    points: ["Watch anytime", "Mobile friendly", "Student dashboard access"],
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f4] text-neutral-950">
      <section className="relative overflow-hidden bg-neutral-950 px-4 py-20 text-white sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(37,211,102,0.28),transparent_30%)]" />
        <div className="relative mx-auto max-w-6xl">
          <Link href="/" className="text-sm font-bold text-white/70 hover:text-white">
            Home
          </Link>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-none sm:text-6xl">
            Services made easy to choose.
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-white/75">
            Every service has one goal: understand the student, choose the right path,
            and make progress visible for the family.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref("Hi Motiva Edus, I want help choosing the right service.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 text-sm font-black text-white"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Ask on WhatsApp
            </a>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-5 text-sm font-black text-neutral-950"
            >
              Student / Staff Login
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-10 sm:px-6">
        {services.map((service, index) => (
          <article
            key={service.id}
            id={service.id}
            className="grid overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm md:grid-cols-[0.9fr_1.1fr]"
          >
            <div className={`relative min-h-72 ${index % 2 ? "md:order-2" : ""}`}>
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            </div>
            <div className="flex flex-col justify-center p-6 sm:p-8">
              <h2 className="text-3xl font-black">{service.title}</h2>
              <p className="mt-3 max-w-xl text-base font-medium leading-7 text-neutral-600">
                {service.subtitle}
              </p>
              <div className="mt-6 grid gap-3">
                {service.points.map((point) => (
                  <div key={point} className="flex items-center gap-3 rounded-lg bg-neutral-50 p-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#25D366]" aria-hidden />
                    <span className="text-sm font-bold text-neutral-800">{point}</span>
                  </div>
                ))}
              </div>
              <a
                href={whatsappHref(`Hi Motiva Edus, I want details about ${service.title}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 text-sm font-black text-white sm:w-fit"
              >
                Enquire now
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
