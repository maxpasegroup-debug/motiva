"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getOfferingsByBrand } from "@/lib/academy-offerings";
import { whatsappHref } from "@/components/marketing/whatsapp";

type PublicCourse = {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
};

type Teacher = {
  id: string;
  name: string;
  subject: string;
  bio: string | null;
  photo: string | null;
};

type ProgramInterest =
  | "hmc_public_speaking_offline"
  | "hmc_public_speaking_online"
  | "hmc_wpst_recorded"
  | "motiva_one_to_one_offline"
  | "motiva_one_to_one_online"
  | "motiva_one_to_one_recorded"
  | "motiva_foundation_remedial_offline"
  | "motiva_foundation_remedial_online"
  | "motiva_foundation_remedial_recorded"
  | "motiva_madrassa_tuition_offline"
  | "motiva_madrassa_tuition_online"
  | "motiva_madrassa_tuition_recorded"
  | "motiva_spoken_english_offline"
  | "motiva_spoken_english_online"
  | "motiva_spoken_english_recorded"
  | "nirvana_offline"
  | "nirvana_online"
  | "nirvana_recorded";

type ContactPreference = "call" | "whatsapp" | "either";

const FOUNDER = {
  name: "Shafeeque Elettil",
  role: "Managing Director, Motiva Edus",
  photoPath: "/md.jpg",
};

const HERO_CLASSROOM_IMAGE =
  "https://images.unsplash.com/photo-1503676382389-4809596d5290?auto=format&fit=crop&w=2200&q=85";

const HERO_STUDENTS_IMAGE =
  "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=900&q=85";

const LEARNING_IMAGE_1 =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80";
const LEARNING_IMAGE_2 =
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80";
const LEARNING_IMAGE_3 =
  "https://images.unsplash.com/photo-1577896852618-301be0011c6b?auto=format&fit=crop&w=800&q=80";

const copy = {
  en: {
    eyebrow: "Simple learning support for Kerala families",
    heroTitle: "HMC, Motiva Edus and Nirvana programs in one simple academy system",
    heroText:
      "Choose public speaking, tuition, remedial support, madrassa tuition, spoken English, or Nirvana training. Every program can run offline, online through Google Meet, or as recorded learning.",
    primaryCta: "Book Free Learning Check",
    whatsappCta: "Ask on WhatsApp",
    secondaryCta: "See Offers",
    heroNote: "No pressure admission. First we understand the child.",
    trust: [
      ["1:1", "Personal teacher attention"],
      ["12/25", "Focused remedial plans"],
      ["Daily", "Parent progress updates"],
      ["PIN", "Simple parent/student login"],
    ],
    parentPainTitle: "For parents worried about marks, basics, and confidence",
    parentPainText:
      "Many children are not lazy. They missed basics, feel shy to ask doubts, and slowly lose confidence. Motiva gives them a patient teacher, a small plan, and visible improvement.",
    painPoints: [
      "Child says yes, but does not understand the lesson",
      "Maths, English, or science basics are weak",
      "Parent does not know what happened in class",
      "Student needs encouragement, not scolding",
    ],
    offersEyebrow: "Core offers",
    offersTitle: "Choose one clear support path",
    offersText:
      "We keep the first decision simple. After the free learning check, our team recommends the right path.",
    programCta: "Enquire for this",
    bestFor: "Best for",
    includes: "Includes",
    priceLabel: "Fee clarity",
    offers: [
      {
        id: "one-to-one",
        marker: "1:1",
        title: "One-to-One Tuition",
        description:
          "Personal online class matched to the student's school syllabus, pace, and confidence level.",
        bestFor: "Regular subject support",
        price: "Monthly fee shared after subject and frequency",
        includes: ["Personal teacher", "Doubt clearing", "Parent follow-up"],
        interest: "motiva_one_to_one_online" as ProgramInterest,
        message: "I want to know about One-to-One Tuition.",
      },
      {
        id: "remedial-12",
        marker: "12",
        title: "12 Day Remedial Plan",
        description:
          "A short, focused plan to identify weak basics and rebuild the first layer of confidence.",
        bestFor: "Fast foundation repair",
        price: "Starting fee shared after learning check",
        includes: ["Gap check", "Daily practice", "Progress summary"],
        interest: "motiva_foundation_remedial_online" as ProgramInterest,
        message: "I want to know about the 12 Day Remedial Plan.",
      },
      {
        id: "remedial-25",
        marker: "25",
        title: "25 Day Remedial Plan",
        description:
          "A deeper support path for students who need more time, repetition, correction, and parent visibility.",
        bestFor: "Deeper learning gaps",
        price: "Plan fee shared after learning check",
        includes: ["Structured classes", "Teacher correction", "Final report"],
        interest: "motiva_foundation_remedial_offline" as ProgramInterest,
        message: "I want to know about the 25 Day Remedial Plan.",
      },
    ],
    reportEyebrow: "Parent visibility",
    reportTitle: "Parents should not be blind after paying fees",
    reportText:
      "Every serious plan should show what the child attended, what improved, and what still needs practice.",
    reportRows: [
      ["Attendance", "9 / 12 days present"],
      ["Current focus", "Fractions and word problems"],
      ["Teacher note", "Understands with examples, needs daily practice"],
      ["Next action", "15 minute home revision after class"],
    ],
    proofEyebrow: "Trust signals",
    proofTitle: "Built for families who need clarity, not confusion",
    proofCards: [
      ["Parent support", "Parent conversations are simple, clear, and direct."],
      ["Human teacher", "Children get attention from real teachers, not only videos."],
      ["WhatsApp first", "Parents can ask questions in the channel they already use."],
      ["Progress record", "Attendance, payments, courses, and updates are tracked."],
    ],
    teachersEyebrow: "Teachers",
    teachersTitle: "Parents can see who teaches their child",
    loadingTeachers: "Loading teachers...",
    emptyTeachers: "Teacher profiles will appear here after the team adds them.",
    founderEyebrow: "Founder trust",
    founderQuote: "We do not just teach. We rebuild confidence and a better future.",
    founderBio:
      "Motiva Edus is built for students who need patient teaching, steady encouragement, and a clear path parents can understand.",
    founderLink: "Read More",
    coursesTitle: "Recorded courses",
    readyTitle: "Start with a free learning check",
    readyText:
      "Share the child name, class, and subject difficulty. The Motiva team will continue on call or WhatsApp.",
    funnelEyebrow: "Free learning gap check",
    funnelPromise:
      "Takes less than one minute. We use these details only to understand the child and call at a convenient time.",
    whatsapp: "WhatsApp",
    whatsappAfterSubmit: "Send the same details on WhatsApp",
    enquirySubmit: "Send Enquiry",
    sending: "Sending...",
    success: "Thank you. We will contact you shortly.",
    submittedTitle: "Learning check request received",
    submittedText:
      "Next: our counselor checks the details, calls in your selected time slot, and suggests the right tuition or remedial path.",
    statusSteps: [
      "Request received",
      "Counselor call / WhatsApp reply",
      "Free learning gap check",
      "Recommended plan",
    ],
    error: "Could not send enquiry.",
    name: "Parent name",
    childName: "Child name",
    childClass: "Child class",
    subjectConcern: "Subject or difficulty",
    callbackSlot: "Best callback time",
    contactPreference: "Preferred contact",
    mobile: "Mobile",
    programInterest: "Support needed",
    message: "Extra note",
    namePlaceholder: "Your name",
    childNamePlaceholder: "Child name",
    childClassPlaceholder: "Example: Class 8",
    subjectConcernPlaceholder: "Example: Maths basics, English reading",
    mobilePlaceholder: "10-digit mobile number",
    messagePlaceholder: "Anything the teacher should know",
    callbackOptions: [
      ["morning", "Morning"],
      ["afternoon", "Afternoon"],
      ["evening", "Evening"],
      ["anytime", "Any time"],
    ] as [string, string][],
    contactOptions: [
      ["call", "Call"],
      ["whatsapp", "WhatsApp"],
      ["either", "Either"],
    ] as [ContactPreference, string][],
    programOptions: getOfferingsByBrand().flatMap((brand) =>
      brand.offerings.map((offering) => [
        offering.key,
        offering.label,
      ] as [ProgramInterest, string]),
    ),
    whatsappPrefillIntro: "Hi Motiva Edus, I want a free learning gap check.",
    explainersEyebrow: "60 second parent explainers",
    explainersTitle: "Know the process before you give your number",
    explainersText:
      "These short parent-facing explainers make the offer clear before the counselor calls.",
    explainers: [
      ["45 sec", "How the free learning gap check works"],
      ["50 sec", "What happens in a 12 day remedial plan"],
      ["55 sec", "How parents receive progress updates"],
    ],
    footerLine:
      "Online tuition and remedial support for confident Kerala students.",
    navigation: "Navigation",
    legal: "Legal",
    connect: "Connect",
  }
} as const;

function formatPrice(price: number): string {
  if (price <= 0) return "Free";
  return `Rs ${price.toFixed(0)}`;
}

function scrollToEnquiry() {
  const target = document.getElementById("enquiry-form");
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}


export function LandingPage({ courses }: { courses: PublicCourse[] }) {
  const c = copy.en;
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [founderImageFailed, setFounderImageFailed] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [childName, setChildName] = useState("");
  const [childClass, setChildClass] = useState("");
  const [subjectConcern, setSubjectConcern] = useState("");
  const [callbackSlot, setCallbackSlot] = useState("evening");
  const [contactPreference, setContactPreference] =
    useState<ContactPreference>("whatsapp");
  const [programInterest, setProgramInterest] =
    useState<ProgramInterest>("motiva_foundation_remedial_online");
  const [message, setMessage] = useState("");
  const [submittedEnquiryId, setSubmittedEnquiryId] = useState<string | null>(
    null,
  );
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/teachers")
      .then((response) => response.json())
      .then((json: { teachers?: Teacher[] }) => {
        if (!cancelled) setTeachers(json.teachers ?? []);
      })
      .catch(() => {
        if (!cancelled) setTeachers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTeachers(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function submitEnquiry(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setSubmittedEnquiryId(null);

    const response = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mobile,
        childName,
        childClass,
        subjectConcern,
        callbackSlot,
        contactPreference,
        programInterest,
        message: message.trim() || undefined,
      }),
    });

    const json = (await response.json().catch(() => null)) as
      | { error?: string; enquiryId?: string }
      | null;

    if (!response.ok) {
      setErrorMessage(json?.error ?? c.error);
      setSending(false);
      return;
    }

    setSuccessMessage(c.success);
    setSubmittedEnquiryId(
      json && "enquiryId" in json && typeof json.enquiryId === "string"
        ? json.enquiryId
        : "sent",
    );
    setName("");
    setMobile("");
    setChildName("");
    setChildClass("");
    setSubjectConcern("");
    setCallbackSlot("evening");
    setContactPreference("whatsapp");
    setProgramInterest("motiva_foundation_remedial_online");
    setMessage("");
    setSending(false);
  }

  function openEnquiry(interest: ProgramInterest, presetMessage?: string) {
    setProgramInterest(interest);
    if (presetMessage) setSubjectConcern(presetMessage);
    scrollToEnquiry();
  }

  function buildWhatsAppMessage() {
    const lines = [
      c.whatsappPrefillIntro,
      name ? `Parent: ${name}` : null,
      mobile ? `Mobile: ${mobile}` : null,
      childName ? `Child: ${childName}` : null,
      childClass ? `Class: ${childClass}` : null,
      subjectConcern ? `Difficulty: ${subjectConcern}` : null,
      callbackSlot ? `Callback time: ${callbackSlot}` : null,
      contactPreference ? `Contact: ${contactPreference}` : null,
      message ? `Note: ${message}` : null,
    ];

    return lines.filter(Boolean).join("\n");
  }
  return (
    <>
      <style>{`
        @keyframes marquee-rtl {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-rtl {
          animation: marquee-rtl 35s linear infinite;
          will-change: transform;
        }
        .animate-marquee-rtl:hover {
          animation-play-state: paused;
        }
      `}</style>
    <main className="w-full overflow-x-hidden bg-white">
      <section className="relative min-h-[86vh] overflow-hidden bg-[#0A1F33] text-white">
        <Image
          src={HERO_CLASSROOM_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-42"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,31,51,0.98)_0%,rgba(10,31,51,0.92)_52%,rgba(10,31,51,0.58)_100%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto grid min-h-[86vh] w-full max-w-6xl items-center gap-10 px-4 pb-14 pt-24 sm:px-6 lg:grid-cols-[1fr_0.68fr] lg:pt-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#F26A2E]" aria-hidden />
              {c.eyebrow}
            </div>

            <h1 className="mt-5 text-balance text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              {c.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
              {c.heroText}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => scrollToEnquiry()}
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-bold text-[#0B5ED7] shadow-lg transition hover:bg-blue-50"
              >
                {c.primaryCta}
              </button>
              <a
                href={whatsappHref(c.heroText)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#25D366] px-6 py-3 text-base font-bold text-white shadow-lg transition hover:bg-[#20BD5A]"
              >
                {c.whatsappCta}
              </a>
              <Link
                href="/#programs"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/55 bg-white/10 px-6 py-3 text-base font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                {c.secondaryCta}
              </Link>
            </div>

            <p className="mt-4 text-sm font-medium text-white/75">{c.heroNote}</p>
          </div>

          <div className="relative overflow-hidden rounded-xl shadow-2xl" style={{ minHeight: "360px" }}>
            <Image
              src={HERO_STUDENTS_IMAGE}
              alt="Students learning at Motiva Edus"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1F33]/90 via-[#0A1F33]/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-2">
              {[
                ["1:1", "Personal Teacher"],
                ["12 / 25", "Day Plans"],
                ["Daily", "Parent Updates"],
                ["Free", "Learning Check"],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/20 bg-white/15 p-2.5 backdrop-blur-md"
                >
                  <p className="text-lg font-extrabold text-white">{value}</p>
                  <p className="text-xs text-white/80">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-4">
          {c.trust.map(([value, label]) => (
            <div key={label} className="rounded-lg bg-white p-4 shadow-sm">
              <p className="text-2xl font-extrabold text-[#0B5ED7]">{value}</p>
              <p className="mt-1 text-sm font-medium leading-5 text-neutral-600">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
            {c.parentPainTitle}
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            {c.parentPainText}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {c.painPoints.map((point) => (
            <div
              key={point}
              className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <p className="text-sm font-semibold leading-6 text-neutral-800">
                {point}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="programs" className="bg-[#F8FAFC] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[0.72fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
                {c.offersEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl">
                {c.offersTitle}
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-neutral-600 lg:justify-self-end">
              {c.offersText}
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {c.offers.map((program) => (
              <article
                id={program.id}
                key={program.id}
                className="flex h-full flex-col rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-sm font-black text-[#0B5ED7]">
                  {program.marker}
                </div>
                <h3 className="mt-5 text-xl font-bold text-neutral-900">
                  {program.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  {program.description}
                </p>
                <div className="mt-5 space-y-4 rounded-lg bg-neutral-50 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                      {c.bestFor}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-neutral-900">
                      {program.bestFor}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                      {c.includes}
                    </p>
                    <p className="mt-1 text-sm text-neutral-700">
                      {program.includes.join(" + ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                      {c.priceLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#0B5ED7]">
                      {program.price}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openEnquiry(program.interest, program.message)}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0B5ED7] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#094fb6]"
                >
                  {c.programCta}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
            {c.reportEyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl">
            {c.reportTitle}
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-600">
            {c.reportText}
          </p>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-500">
                Sample progress report
              </p>
              <p className="mt-1 text-lg font-bold text-neutral-900">
                12 Day Remedial Plan
              </p>
            </div>
            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
              Active
            </span>
          </div>
          <div className="mt-4 divide-y divide-neutral-100">
            {c.reportRows.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-[0.36fr_1fr]">
                <p className="text-sm font-bold text-neutral-500">{label}</p>
                <p className="text-sm font-semibold leading-6 text-neutral-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50 py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
            {c.proofEyebrow}
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold text-neutral-900 sm:text-4xl">
            {c.proofTitle}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {c.proofCards.map(([title, text]) => (
              <div
                key={title}
                className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-bold text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {courses.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold text-neutral-900">{c.coursesTitle}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
              >
                <div className="relative aspect-video bg-neutral-100">
                  {course.thumbnail ? (
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="space-y-3 p-5">
                  <h3 className="text-lg font-bold text-neutral-900">
                    {course.title}
                  </h3>
                  <p className="text-sm font-bold text-[#0B5ED7]">
                    {formatPrice(course.price)}
                  </p>
                  <Link
                    href={`/courses/${course.id}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50"
                  >
                    {c.secondaryCta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
          <div className="flex justify-center lg:justify-start">
            {founderImageFailed ? (
              <div className="flex h-72 w-72 items-center justify-center rounded-lg bg-[#0B5ED7] text-7xl font-bold text-white shadow-lg">
                {FOUNDER.name.charAt(0)}
              </div>
            ) : (
              <Image
                src={FOUNDER.photoPath}
                alt={FOUNDER.name}
                width={420}
                height={420}
                className="h-auto w-full max-w-sm rounded-lg object-cover shadow-xl"
                onError={() => setFounderImageFailed(true)}
              />
            )}
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
              {c.founderEyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl">
              {FOUNDER.name}
            </h2>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              {FOUNDER.role}
            </p>
            <blockquote className="mt-5 border-l-4 border-orange-500 pl-4 text-lg italic leading-relaxed text-neutral-700">
              &quot;{c.founderQuote}&quot;
            </blockquote>
            <p className="mt-5 text-base leading-relaxed text-neutral-700">
              {c.founderBio}
            </p>
            <Link
              href="/about"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-200 px-5 py-3 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50"
            >
              {c.founderLink}
            </Link>
          </div>
        </div>
      </section>

      <section id="teachers" className="overflow-hidden border-y border-neutral-200 bg-[#F0F4FF] py-14">
        <div className="mx-auto mb-8 w-full max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
            {c.teachersEyebrow}
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold text-neutral-900 sm:text-4xl">
            {c.teachersTitle}
          </h2>
        </div>

        {loadingTeachers ? (
          <p className="px-6 text-sm text-neutral-500">{c.loadingTeachers}</p>
        ) : teachers.length === 0 ? (
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="rounded-lg border border-dashed border-neutral-300 bg-white/60 p-6">
              <p className="text-sm text-neutral-600">{c.emptyTeachers}</p>
            </div>
          </div>
        ) : (
          <div className="relative flex overflow-hidden">
            <div className="animate-marquee-rtl flex gap-5">
              {[...teachers, ...teachers].map((teacher, idx) => (
                <div
                  key={`${teacher.id}-${idx}`}
                  className="flex w-44 flex-shrink-0 flex-col items-center rounded-xl border border-neutral-200 bg-white p-4 text-center shadow-sm"
                >
                  {teacher.photo ? (
                    <Image
                      src={teacher.photo}
                      alt={teacher.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0B5ED7] text-2xl font-bold text-white">
                      {teacher.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="mt-3 text-sm font-bold leading-5 text-neutral-900">
                    {teacher.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#0B5ED7]">
                    {teacher.subject}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="border-y border-neutral-200 bg-[#F8FAFC] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
            Learning that matters
          </p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[0.72fr_1fr] lg:items-end">
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              Where students rediscover confidence
            </h2>
            <p className="max-w-2xl text-base leading-7 text-neutral-600 lg:justify-self-end">
              Every child learns differently. Motiva teachers take the time to find the right approach —
              building basics, clearing doubts, and showing visible results to parents.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                image: LEARNING_IMAGE_1,
                tag: "1:1 Attention",
                title: "Every child gets a personal teacher",
                text: "No batch confusion. The teacher focuses on one child at a time, at their own pace.",
              },
              {
                image: LEARNING_IMAGE_2,
                tag: "Clear Progress",
                title: "Parents see what changed each week",
                text: "Attendance records, teacher notes, and next steps — all in one report.",
              },
              {
                image: LEARNING_IMAGE_3,
                tag: "Confidence First",
                title: "From fear to curiosity in small steps",
                text: "Motiva teachers start with what the student knows, then build steadily forward.",
              },
            ].map(({ image, tag, title, text }) => (
              <div
                key={title}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={image} alt={title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-[#0B5ED7] px-3 py-1 text-xs font-bold text-white">
                    {tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold text-neutral-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-950 py-16 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold">{c.readyTitle}</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/80">
            {c.readyText}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref(buildWhatsAppMessage())}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#25D366] px-6 py-3 text-base font-bold text-white"
            >
              {c.whatsapp}
            </a>
            <button
              type="button"
              onClick={() => scrollToEnquiry()}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0B5ED7] px-6 py-3 text-base font-bold text-white"
            >
              {c.primaryCta}
            </button>
          </div>

          <form
            id="enquiry-form"
            onSubmit={submitEnquiry}
            className="mt-8 grid gap-4 rounded-lg border border-white/15 bg-white/5 p-5 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8BD7FF]">
                {c.funnelEyebrow}
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                {c.funnelPromise}
              </p>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>{c.name}</span>
              <input
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60"
                placeholder={c.namePlaceholder}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>{c.childName}</span>
              <input
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60"
                placeholder={c.childNamePlaceholder}
                value={childName}
                onChange={(event) => setChildName(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>{c.mobile}</span>
              <input
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60"
                placeholder={c.mobilePlaceholder}
                value={mobile}
                onChange={(event) => setMobile(event.target.value.replace(/\D/g, ""))}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>{c.childClass}</span>
              <input
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60"
                placeholder={c.childClassPlaceholder}
                value={childClass}
                onChange={(event) => setChildClass(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>{c.programInterest}</span>
              <select
                value={programInterest}
                onChange={(event) =>
                  setProgramInterest(event.target.value as ProgramInterest)
                }
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white"
              >
                {c.programOptions.map(([value, label]) => (
                  <option key={value} value={value} className="text-neutral-900">
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>{c.subjectConcern}</span>
              <input
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60"
                placeholder={c.subjectConcernPlaceholder}
                value={subjectConcern}
                onChange={(event) => setSubjectConcern(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>{c.callbackSlot}</span>
              <select
                value={callbackSlot}
                onChange={(event) => setCallbackSlot(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white"
              >
                {c.callbackOptions.map(([value, label]) => (
                  <option key={value} value={value} className="text-neutral-900">
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>{c.contactPreference}</span>
              <select
                value={contactPreference}
                onChange={(event) =>
                  setContactPreference(event.target.value as ContactPreference)
                }
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white"
              >
                {c.contactOptions.map(([value, label]) => (
                  <option key={value} value={value} className="text-neutral-900">
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>{c.message}</span>
              <input
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60"
                placeholder={c.messagePlaceholder}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-bold text-[#0B5ED7] disabled:opacity-60"
              >
                {sending ? c.sending : c.enquirySubmit}
              </button>
              <a
                href={whatsappHref(buildWhatsAppMessage())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#25D366] px-6 py-3 text-base font-bold text-white"
              >
                {c.whatsappAfterSubmit}
              </a>
            </div>

            {successMessage ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900 md:col-span-2">
                <p className="text-base font-bold">{c.submittedTitle}</p>
                <p className="mt-1 text-sm leading-6">{c.submittedText}</p>
                <ol className="mt-4 grid gap-2 sm:grid-cols-4">
                  {c.statusSteps.map((step, index) => (
                    <li
                      key={step}
                      className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800"
                    >
                      {index + 1}. {step}
                    </li>
                  ))}
                </ol>
                {submittedEnquiryId ? (
                  <p className="mt-3 text-xs font-semibold text-emerald-700">
                    {successMessage}
                  </p>
                ) : null}
              </div>
            ) : null}

            {errorMessage ? (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
                {errorMessage}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white py-14">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Image src="/logo.png" alt="Motiva Edus" width={132} height={44} />
            <p className="mt-4 text-sm leading-6 text-neutral-600">
              {c.footerLine}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {c.navigation}
            </h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-neutral-700">
              <Link href="/">Home</Link>
              <Link href="/#programs">Programs</Link>
              <Link href="/about">About</Link>
              <Link href="/#enquiry-form">Contact</Link>
              <Link href="/courses">Courses</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {c.legal}
            </h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-neutral-700">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/refund">Refund Policy</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              {c.connect}
            </h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-neutral-700">
              <a
                href={whatsappHref("Hi, I would like to know more about Motiva Edus.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-10 w-full max-w-6xl px-4 text-xs text-neutral-500 sm:px-6">
          Copyright 2026 Motiva Edus. All rights reserved.
        </p>
      </footer>
    </main>
    </>
  );
}

