"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, LogIn, MessageCircle, PlayCircle, Sparkles, UsersRound } from "lucide-react";
import { whatsappHref } from "@/components/marketing/whatsapp";
import { getOfferingsByBrand } from "@/lib/academy-offerings";

type PublicCourse = {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=2200&q=86";
const REMEDIAL_IMAGE =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=82";
const TUITION_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=82";
const SPOKEN_IMAGE =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=82";

const services = [
  {
    title: "Foundation / Remedial",
    label: "12 and 25 day plans",
    image: REMEDIAL_IMAGE,
    href: "/services#foundation",
  },
  {
    title: "One-to-One Tuition",
    label: "Personal online support",
    image: TUITION_IMAGE,
    href: "/services#tuition",
  },
  {
    title: "Spoken English",
    label: "Confidence and fluency",
    image: SPOKEN_IMAGE,
    href: "/services#spoken-english",
  },
] as const;

const steps = [
  ["Ask", "Send one WhatsApp message"],
  ["Check", "Free learning gap check"],
  ["Start", "Teacher, batch, and dashboard"],
] as const;

function formatPrice(price: number) {
  if (price <= 0) return "Free";
  return `Rs ${price.toFixed(0)}`;
}

export function VisualLandingPage({ courses }: { courses: PublicCourse[] }) {
  const offerings = useMemo(
    () => getOfferingsByBrand().flatMap((brand) => brand.offerings),
    [],
  );
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [programInterest, setProgramInterest] = useState(
    offerings[0]?.key ?? "motiva_one_to_one_online",
  );
  const [subjectConcern, setSubjectConcern] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setMessage(null);

    const response = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mobile,
        programInterest,
        subjectConcern,
        contactPreference: "whatsapp",
        callbackSlot: "anytime",
      }),
    });

    setSending(false);

    if (!response.ok) {
      setMessage("Could not send enquiry. Please try WhatsApp.");
      return;
    }

    setName("");
    setMobile("");
    setSubjectConcern("");
    setMessage("Enquiry sent. Our team will contact you shortly.");
  }

  const whatsappMessage = [
    "Hi Motiva Edus, I want course details.",
    name ? `Name: ${name}` : null,
    mobile ? `Mobile: ${mobile}` : null,
    subjectConcern ? `Need: ${subjectConcern}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f8f4] text-neutral-950">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/20 bg-neutral-950/80 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Motiva Edus" width={118} height={38} className="h-9 w-auto rounded bg-white px-2 py-1" />
            <span className="hidden text-sm font-semibold sm:inline">Learning made simple</span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/services" className="rounded-lg px-4 py-2 text-sm font-semibold text-white/82 hover:bg-white/10">
              Services
            </Link>
            <Link href="/courses" className="rounded-lg px-4 py-2 text-sm font-semibold text-white/82 hover:bg-white/10">
              Courses
            </Link>
            <Link href="/login" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-neutral-950">
              <LogIn className="h-4 w-4" aria-hidden />
              Login
            </Link>
          </nav>
          <Link href="/login" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-neutral-950 md:hidden">
            <LogIn className="h-4 w-4" aria-hidden />
            Login
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-neutral-950 pt-16 text-white lg:min-h-[92vh]">
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-48 sm:opacity-56"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(37,211,102,0.28),transparent_24%),linear-gradient(180deg,rgba(10,10,10,0.92),rgba(10,10,10,0.80)),linear-gradient(90deg,rgba(10,10,10,0.95),rgba(10,10,10,0.58))] lg:bg-[radial-gradient(circle_at_20%_25%,rgba(37,211,102,0.34),transparent_28%),linear-gradient(90deg,rgba(10,10,10,0.96),rgba(10,10,10,0.70),rgba(10,10,10,0.35))]" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-start gap-6 px-4 pb-24 pt-8 sm:gap-8 sm:px-6 sm:pb-12 sm:pt-10 md:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] md:items-center lg:min-h-[calc(92vh-4rem)] lg:grid-cols-[minmax(0,1fr)_420px] lg:py-10">
          <div className="max-w-3xl">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-2 text-xs font-bold backdrop-blur sm:text-sm">
              <Sparkles className="h-4 w-4 shrink-0 text-[#25D366]" aria-hidden />
              <span className="min-w-0 truncate sm:whitespace-normal">
                Tuition, remedial, spoken English, madrassa
              </span>
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.02] tracking-normal text-white min-[390px]:text-5xl sm:text-6xl lg:text-7xl">
              See the right class. Start faster.
            </h1>
            <p className="mt-4 max-w-xl text-base font-medium leading-7 text-white/82 sm:mt-5 sm:text-lg sm:leading-8">
              Less confusion for parents. Clear service pages, quick WhatsApp enquiry, and simple login for students, parents, mentors, and staff.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row md:flex-col lg:flex-row">
              <a
                href={whatsappHref("Hi Motiva Edus, I want to know the best course for my child.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-sm font-black text-white shadow-xl shadow-emerald-950/25 sm:min-h-14 sm:px-6 sm:text-base"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                WhatsApp Enquiry
              </a>
              <Link
                href="/services"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-neutral-950 sm:min-h-14 sm:px-6 sm:text-base"
              >
                View Services
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
          </div>

          <form
            onSubmit={submitEnquiry}
            className="w-full rounded-xl border border-white/20 bg-white/14 p-4 shadow-2xl backdrop-blur-xl sm:p-5"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#A7F3D0]">
              Quick enquiry
            </p>
            <div className="mt-4 grid gap-3">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Parent / student name"
                className="min-h-12 rounded-lg border border-white/20 bg-white px-4 text-sm font-semibold text-neutral-950 outline-none"
                required
              />
              <input
                value={mobile}
                onChange={(event) => setMobile(event.target.value.replace(/\D/g, ""))}
                placeholder="Mobile number"
                inputMode="numeric"
                className="min-h-12 rounded-lg border border-white/20 bg-white px-4 text-sm font-semibold text-neutral-950 outline-none"
                required
              />
              <select
                value={programInterest}
                onChange={(event) => setProgramInterest(event.target.value)}
                className="min-h-12 rounded-lg border border-white/20 bg-white px-4 text-sm font-semibold text-neutral-950 outline-none"
              >
                {offerings.map((offering) => (
                  <option key={offering.key} value={offering.key}>
                    {offering.label}
                  </option>
                ))}
              </select>
              <input
                value={subjectConcern}
                onChange={(event) => setSubjectConcern(event.target.value)}
                placeholder="Subject / need"
                className="min-h-12 rounded-lg border border-white/20 bg-white px-4 text-sm font-semibold text-neutral-950 outline-none"
              />
              <button
                type="submit"
                disabled={sending}
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-black text-white disabled:opacity-60"
              >
                {sending ? "Sending..." : "Send Enquiry"}
              </button>
              <a
                href={whatsappHref(whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 text-sm font-black text-white"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Continue on WhatsApp
              </a>
              {message ? <p className="text-sm font-bold text-white">{message}</p> : null}
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-8 sm:px-6 md:grid-cols-3">
        {steps.map(([title, text], index) => (
          <div key={title} className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-950 text-sm font-black text-white">
              {index + 1}
            </span>
            <h2 className="mt-4 text-xl font-black">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-neutral-600">{text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#0B5ED7]">Services</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Choose by need</h2>
          </div>
          <Link href="/services" className="hidden min-h-11 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-black sm:inline-flex">
            Details
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <Link key={service.title} href={service.href} className="group relative min-h-80 overflow-hidden rounded-xl bg-neutral-900 shadow-sm">
              <Image src={service.image} alt={service.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-sm font-bold text-white/75">{service.label}</p>
                <h3 className="mt-1 text-2xl font-black">{service.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 rounded-2xl bg-neutral-950 p-5 text-white shadow-xl sm:p-8 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#25D366]">Dashboard access</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">One login. Correct dashboard.</h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-white/72">
              Students, parents, mentors, teachers, telecallers, and admins use the same login page. The system opens the correct dashboard after PIN verification.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              [GraduationCap, "Student"],
              [UsersRound, "Parent"],
              [BookOpen, "Mentor"],
              [CheckCircle2, "Staff"],
            ].map(([Icon, label]) => (
              <div key={String(label)} className="rounded-xl border border-white/10 bg-white/10 p-4">
                <Icon className="h-5 w-5 text-[#25D366]" aria-hidden />
                <p className="mt-3 text-lg font-black">{String(label)}</p>
              </div>
            ))}
          </div>
          <Link href="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-black text-neutral-950 lg:w-fit">
            Open Login
            <LogIn className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {courses.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-black">Recorded courses</h2>
            <Link href="/courses" className="text-sm font-black text-[#0B5ED7]">View all</Link>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 3).map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative aspect-video bg-neutral-200">
                  {course.thumbnail ? <Image src={course.thumbnail} alt={course.title} fill className="object-cover" /> : <PlayCircle className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-neutral-500" />}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-base font-black">{course.title}</h3>
                  <p className="mt-2 text-sm font-black text-[#0B5ED7]">{formatPrice(course.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="pb-24 pt-10 md:pb-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 border-t border-neutral-200 px-4 pt-6 text-sm font-semibold text-neutral-600 sm:px-6 md:flex-row md:items-center md:justify-between">
          <span>Copyright 2026 Motiva Edus.</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/refund">Refund</Link>
          </div>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-neutral-200 bg-white/95 p-2 shadow-2xl backdrop-blur md:hidden">
        <Link href="/services" className="flex min-h-12 flex-col items-center justify-center rounded-lg text-xs font-black text-neutral-700">
          Services
        </Link>
        <a href={whatsappHref("Hi Motiva Edus, I need course details.")} target="_blank" rel="noopener noreferrer" className="flex min-h-12 flex-col items-center justify-center rounded-lg bg-[#25D366] text-xs font-black text-white">
          WhatsApp
        </a>
        <Link href="/login" className="flex min-h-12 flex-col items-center justify-center rounded-lg text-xs font-black text-neutral-700">
          Login
        </Link>
      </nav>
    </main>
  );
}
