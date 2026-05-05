"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WHATSAPP_NUMBER, whatsappHref } from "@/components/marketing/whatsapp";
import { useLanguage } from "@/components/providers/LanguageProvider";

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

const FOUNDER = {
  name: "Shafeeque Elettil",
  role: "Managing Director, Motiva Edus",
  photoPath: "/md.jpg",
};

const HERO_CLASSROOM_IMAGE =
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=2200&q=85";

const copy = {
  en: {
    eyebrow: "Kerala online tuition + remedial support",
    heroTitle: "Online tuition and confidence-building support for Kerala students",
    heroText:
      "One-to-one classes, 12/25 day remedial plans, parent updates, and recorded lessons that help children rebuild basics and learn with confidence.",
    primaryCta: "Book Free Consultation",
    secondaryCta: "View Courses",
    trust: [
      ["1:1", "Personal teacher attention"],
      ["12/25", "Focused remedial plans"],
      ["Daily", "Class and progress follow-up"],
      ["Malayalam", "Parent-friendly communication"],
    ],
    programsEyebrow: "Programs",
    programsTitle: "Choose the support your child needs now",
    programsText:
      "Keep the offer clear for parents: academic support first, then confidence and career growth as add-ons.",
    programCta: "Enquire",
    coursesTitle: "Recorded growth courses",
    teachersEyebrow: "Teachers",
    teachersTitle: "Learn with experienced mentors and subject experts",
    loadingTeachers: "Loading teachers...",
    emptyTeachers: "Our expert team is coming soon.",
    howEyebrow: "How it works",
    howTitle: "A simple learning path parents can trust",
    howSteps: [
      ["Understand", "We listen to the parent and identify the student's learning gaps."],
      ["Match", "The student is matched with a suitable teacher or remedial plan."],
      ["Teach", "Classes focus on clarity, practice, correction, and confidence."],
      ["Update", "Parents get steady follow-up so progress never feels invisible."],
    ],
    founderEyebrow: "About the Founder",
    founderQuote: "We do not just teach. We build confidence and a better future.",
    founderBio:
      "At Motiva Edus, every student matters. Our team is committed to clear teaching, steady encouragement, and practical paths that help learners grow with pride.",
    founderLink: "Read More",
    readyTitle: "Ready to talk about your child?",
    readyText:
      "Share a few details. The Motiva team will continue the conversation on call or WhatsApp.",
    whatsapp: "WhatsApp",
    enquirySubmit: "Send Enquiry",
    sending: "Sending...",
    success: "Thank you. We will contact you shortly.",
    error: "Could not send enquiry.",
    name: "Name",
    mobile: "Mobile",
    programInterest: "Program Interest",
    message: "Message (Optional)",
    namePlaceholder: "Your name",
    mobilePlaceholder: "10-digit mobile number",
    messagePlaceholder: "Tell us what you need help with",
    footerLine: "Structured online tuition and growth programs for confident students.",
    navigation: "Navigation",
    legal: "Legal",
    connect: "Connect",
  },
  ml: {
    eyebrow: "കേരള ഓൺലൈൻ ട്യൂഷൻ + റിമീഡിയൽ സപ്പോർട്ട്",
    heroTitle: "കേരള വിദ്യാർത്ഥികൾക്കായി ഓൺലൈൻ ട്യൂഷനും ആത്മവിശ്വാസ പിന്തുണയും",
    heroText:
      "വൺ-ടു-വൺ ക്ലാസുകൾ, 12/25 ദിവസ റിമീഡിയൽ പ്ലാനുകൾ, പാരന്റ് അപ്ഡേറ്റുകൾ, റെക്കോർഡഡ് ലെസണുകൾ.",
    primaryCta: "ഫ്രീ കൺസൾട്ടേഷൻ",
    secondaryCta: "കോഴ്സുകൾ കാണുക",
    trust: [
      ["1:1", "വ്യക്തിഗത ശ്രദ്ധ"],
      ["12/25", "റിമീഡിയൽ പ്ലാനുകൾ"],
      ["Daily", "പ്രോഗ്രസ് ഫോളോ-അപ്പ്"],
      ["Malayalam", "പാരന്റ് കമ്മ്യൂണിക്കേഷൻ"],
    ],
    programsEyebrow: "പ്രോഗ്രാമുകൾ",
    programsTitle: "നിങ്ങളുടെ കുട്ടിക്ക് ഇപ്പോൾ വേണ്ട പിന്തുണ തിരഞ്ഞെടുക്കുക",
    programsText:
      "ആദ്യം അക്കാദമിക് പിന്തുണ, പിന്നെ ആത്മവിശ്വാസവും കരിയർ വളർച്ചയും.",
    programCta: "എൻക്വയർ",
    coursesTitle: "റെക്കോർഡഡ് ഗ്രോത്ത് കോഴ്സുകൾ",
    teachersEyebrow: "ടീച്ചേഴ്സ്",
    teachersTitle: "അനുഭവസമ്പന്നരായ മെന്റർമാരോടും ടീച്ചർമാരോടും പഠിക്കുക",
    loadingTeachers: "ടീച്ചർമാർ ലോഡ് ചെയ്യുന്നു...",
    emptyTeachers: "ഞങ്ങളുടെ ടീം ഉടൻ വരുന്നു.",
    howEyebrow: "രീതി",
    howTitle: "പാരന്റുകൾക്ക് വിശ്വസിക്കാവുന്ന ലളിതമായ പഠനപാത",
    howSteps: [
      ["Understand", "വിദ്യാർത്ഥിയുടെ പഠനഗ്യാപ്പുകൾ ആദ്യം മനസ്സിലാക്കുന്നു."],
      ["Match", "അനുയോജ്യമായ ടീച്ചറെയോ റിമീഡിയൽ പ്ലാനെയോ മാച്ച് ചെയ്യുന്നു."],
      ["Teach", "ക്ലാരിറ്റി, പ്രാക്ടീസ്, കറക്ഷൻ, കോൺഫിഡൻസ് എന്നിവയിൽ ശ്രദ്ധ."],
      ["Update", "പ്രോഗ്രസ് വ്യക്തമാകാൻ സ്ഥിരമായ പാരന്റ് ഫോളോ-അപ്പ്."],
    ],
    founderEyebrow: "Founder",
    founderQuote: "ഞങ്ങൾ പഠിപ്പിക്കുന്നത് മാത്രമല്ല. ആത്മവിശ്വാസവും ഭാവിയും നിർമ്മിക്കുന്നു.",
    founderBio:
      "Motiva Edus-ൽ ഓരോ വിദ്യാർത്ഥിയും പ്രധാനമാണ്. വ്യക്തമായ പഠനം, സ്ഥിരമായ പ്രോത്സാഹനം, പ്രായോഗിക വളർച്ചാപാതകൾ എന്നിവയാണ് ഞങ്ങളുടെ ശ്രദ്ധ.",
    founderLink: "കൂടുതൽ വായിക്കുക",
    readyTitle: "നിങ്ങളുടെ കുട്ടിയെക്കുറിച്ച് സംസാരിക്കാമോ?",
    readyText:
      "കുറച്ച് വിവരങ്ങൾ ഷെയർ ചെയ്യൂ. Motiva ടീം കോൾ അല്ലെങ്കിൽ WhatsApp വഴി തുടരും.",
    whatsapp: "WhatsApp",
    enquirySubmit: "എൻക്വയറി അയക്കുക",
    sending: "അയക്കുന്നു...",
    success: "നന്ദി. ഞങ്ങൾ ഉടൻ ബന്ധപ്പെടും.",
    error: "എൻക്വയറി അയക്കാൻ കഴിഞ്ഞില്ല.",
    name: "പേര്",
    mobile: "മൊബൈൽ",
    programInterest: "പ്രോഗ്രാം",
    message: "സന്ദേശം (Optional)",
    namePlaceholder: "നിങ്ങളുടെ പേര്",
    mobilePlaceholder: "10-digit mobile number",
    messagePlaceholder: "നിങ്ങൾക്ക് എന്ത് സഹായമാണ് വേണ്ടത്?",
    footerLine: "ആത്മവിശ്വാസമുള്ള വിദ്യാർത്ഥികൾക്കായി ഓൺലൈൻ ട്യൂഷനും ഗ്രോത്ത് പ്രോഗ്രാമുകളും.",
    navigation: "Navigation",
    legal: "Legal",
    connect: "Connect",
  },
} as const;

const programOptions = [
  { value: "tuition", label: "One-to-One Tuition" },
  { value: "remedial", label: "Remedial Classes" },
  { value: "recorded_courses", label: "Recorded Courses" },
  { value: "career_counseling", label: "Career Counseling" },
  { value: "other", label: "Other" },
];

const programs = [
  {
    id: "one-to-one",
    marker: "01",
    title: "One-to-One Tuition",
    description:
      "Personal classes matched to the student's pace, school syllabus, and confidence level.",
    interest: "tuition",
  },
  {
    id: "remedial",
    marker: "12/25",
    title: "Remedial Classes",
    description:
      "Short, focused programs to rebuild foundations and close learning gaps quickly.",
    interest: "remedial",
  },
  {
    id: "public-speaking",
    marker: "SP",
    title: "Public Speaking",
    description:
      "Guided speaking practice for stage confidence, clarity, and self-expression.",
    interest: "other",
    message: "I am interested in Public Speaking Training.",
  },
  {
    id: "career-counseling",
    marker: "CG",
    title: "Career Counseling",
    description:
      "Structured guidance to help students understand options and choose next steps.",
    interest: "career_counseling",
  },
] as const;

function formatPrice(price: number): string {
  if (price <= 0) return "Free";
  return `Rs ${price.toFixed(0)}`;
}

function scrollToEnquiry() {
  const target = document.getElementById("enquiry-form");
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function TeacherAvatar({
  name,
  photo,
}: {
  name: string;
  photo: string | null;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "M";

  if (!photo) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0B5ED7] text-2xl font-bold text-white">
        {initial}
      </div>
    );
  }

  return (
    <Image
      src={photo}
      alt={name}
      width={96}
      height={96}
      className="h-20 w-20 rounded-2xl object-cover"
    />
  );
}

export function LandingPage({ courses }: { courses: PublicCourse[] }) {
  const { locale } = useLanguage();
  const c = copy[locale];
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [founderImageFailed, setFounderImageFailed] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [programInterest, setProgramInterest] = useState("tuition");
  const [message, setMessage] = useState("");
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

    const response = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mobile,
        programInterest,
        message: message.trim() || undefined,
      }),
    });

    const json = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setErrorMessage(json?.error ?? c.error);
      setSending(false);
      return;
    }

    setSuccessMessage(c.success);
    setName("");
    setMobile("");
    setProgramInterest("tuition");
    setMessage("");
    setSending(false);
  }

  function openEnquiry(interest: string, presetMessage?: string) {
    setProgramInterest(interest);
    if (presetMessage) setMessage(presetMessage);
    scrollToEnquiry();
  }

  return (
    <main className="w-full overflow-x-hidden bg-white">
      <section className="relative min-h-[82vh] overflow-hidden bg-[#091323] text-white">
        <Image
          src={HERO_CLASSROOM_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-55"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,19,35,0.96)_0%,rgba(9,19,35,0.88)_45%,rgba(9,19,35,0.52)_100%)]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto grid min-h-[82vh] w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-24 sm:px-6 lg:grid-cols-[1fr_0.72fr] lg:pt-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md">
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
              <Link
                href="/courses"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/60 bg-white/10 px-6 py-3 text-base font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                {c.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="hidden rounded-xl border border-white/18 bg-white/95 p-5 text-neutral-900 shadow-2xl lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B5ED7]">
              Student Plan
            </p>
            <div className="mt-5 space-y-4">
              {[
                ["Assess", "Find learning gaps"],
                ["Plan", "Set class rhythm"],
                ["Practice", "Correct and rebuild"],
                ["Report", "Update parents"],
              ].map(([step, text]) => (
                <div key={step} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-sm font-black text-[#F26A2E]">
                    {step.slice(0, 2)}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{step}</p>
                    <p className="text-sm text-neutral-600">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="mx-auto grid w-full max-w-6xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-4">
          {c.trust.map(([value, label]) => (
            <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-2xl font-extrabold text-[#0B5ED7]">{value}</p>
              <p className="mt-1 text-sm font-medium leading-5 text-neutral-600">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="programs" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[0.72fr_1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
              {c.programsEyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl">
              {c.programsTitle}
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-neutral-600 lg:justify-self-end">
            {c.programsText}
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {programs.map((program, index) => (
            <motion.article
              id={program.id}
              key={program.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-sm font-black text-[#0B5ED7]">
                {program.marker}
              </div>
              <h3 className="mt-5 text-xl font-bold text-neutral-900">
                {program.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-neutral-600">
                {program.description}
              </p>
              <button
                type="button"
                onClick={() =>
                  openEnquiry(
                    program.interest,
                    "message" in program ? program.message : undefined,
                  )
                }
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-200 px-4 py-3 text-sm font-bold text-neutral-900 transition hover:bg-neutral-50"
              >
                {c.programCta}
              </button>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-[#F8FAFC] py-16">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
            {c.howEyebrow}
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-bold text-neutral-900 sm:text-4xl">
            {c.howTitle}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {c.howSteps.map(([title, text], index) => (
              <div
                key={title}
                className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-black text-[#F26A2E]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-lg font-bold text-neutral-900">
                  {title}
                </h3>
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
            {courses.map((course, index) => (
              <motion.article
                key={course.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
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
              </motion.article>
            ))}
          </div>
        </section>
      ) : null}

      <section id="teachers" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
          {c.teachersEyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold text-neutral-900 sm:text-4xl">
          {c.teachersTitle}
        </h2>

        {loadingTeachers ? (
          <p className="mt-6 text-sm text-neutral-500">{c.loadingTeachers}</p>
        ) : teachers.length === 0 ? (
          <p className="mt-6 text-sm text-neutral-600">{c.emptyTeachers}</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {teachers.map((teacher, index) => (
              <motion.article
                key={teacher.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <TeacherAvatar name={teacher.name} photo={teacher.photo} />
                <h3 className="mt-4 text-base font-bold text-neutral-900">
                  {teacher.name}
                </h3>
                <p className="mt-1 text-sm text-neutral-500">{teacher.subject}</p>
                <p
                  className="mt-3 text-sm leading-6 text-neutral-600"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {teacher.bio || "More details coming soon."}
                </p>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-12">
          <div className="flex justify-center lg:justify-start">
            {founderImageFailed ? (
              <div className="flex h-72 w-72 items-center justify-center rounded-2xl bg-[#0B5ED7] text-7xl font-bold text-white shadow-lg">
                {FOUNDER.name.charAt(0)}
              </div>
            ) : (
              <Image
                src={FOUNDER.photoPath}
                alt={FOUNDER.name}
                width={420}
                height={420}
                className="h-auto w-full max-w-sm rounded-2xl object-cover shadow-xl"
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

      <section className="bg-neutral-950 py-16 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold">{c.readyTitle}</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/80">
            {c.readyText}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
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
            className="mt-8 grid gap-4 rounded-xl border border-white/15 bg-white/5 p-5 md:grid-cols-2"
          >
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
              <span>{c.programInterest}</span>
              <select
                value={programInterest}
                onChange={(event) => setProgramInterest(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white"
              >
                {programOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
            <button
              type="submit"
              disabled={sending}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-bold text-[#0B5ED7] disabled:opacity-60 md:col-span-2"
            >
              {sending ? c.sending : c.enquirySubmit}
            </button>

            {successMessage ? (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 md:col-span-2">
                {successMessage}
              </p>
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
  );
}
