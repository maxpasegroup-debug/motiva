"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { WHATSAPP_NUMBER, whatsappHref } from "@/components/marketing/whatsapp";

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
  quote: "We don’t just teach, we build confidence and future.",
  bio: "At Motiva Edus, every student matters. Our team is committed to clear teaching, steady encouragement, and paths that help learners grow with pride—in class and in life.",
};

const HERO_CLASSROOM_IMAGE =
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=2200&q=85";

const STATIC_PROGRAMS = [
  {
    id: "tuition",
    icon: "👨‍🏫",
    title: "One-to-One Tuition",
    description:
      "Personalized sessions tailored to your child's learning pace and style",
    interest: "tuition",
    message: undefined,
  },
  {
    id: "remedial",
    icon: "📚",
    title: "Remedial Classes (12 & 25 Days)",
    description:
      "Intensive focused programs to close learning gaps quickly",
    interest: "remedial",
    message: undefined,
  },
  {
    id: "public-speaking",
    icon: "🎤",
    title: "Public Speaking Training",
    description:
      "Build confidence and communication skills for life",
    interest: "other",
    message: "I am interested in Public Speaking Training.",
  },
  {
    id: "career-counseling",
    icon: "🎯",
    title: "Career Counseling",
    description:
      "Expert guidance to help students find their direction",
    interest: "career_counseling",
    message: undefined,
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
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#0B5ED7] to-[#1a3a6b] text-3xl font-bold text-white">
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
      className="h-24 w-24 rounded-full object-cover"
    />
  );
}

export function LandingPage({ courses }: { courses: PublicCourse[] }) {
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
        if (!cancelled) {
          setTeachers(json.teachers ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTeachers([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTeachers(false);
        }
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
      setErrorMessage(json?.error ?? "Could not send enquiry.");
      setSending(false);
      return;
    }

    setSuccessMessage("Thank you! We will contact you shortly.");
    setName("");
    setMobile("");
    setProgramInterest("tuition");
    setMessage("");
    setSending(false);
  }

  function openEnquiry(interest: string, presetMessage?: string) {
    setProgramInterest(interest);
    if (presetMessage) {
      setMessage(presetMessage);
    }
    scrollToEnquiry();
  }

  return (
    <main className="w-full overflow-x-hidden bg-white">
      <section className="relative min-h-[88vh] overflow-hidden bg-[#091323] text-white">
        <Image
          src={HERO_CLASSROOM_IMAGE}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-55"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,19,35,0.96)_0%,rgba(9,19,35,0.84)_40%,rgba(9,19,35,0.48)_72%,rgba(9,19,35,0.74)_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white via-white/60 to-transparent"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex min-h-[88vh] w-full max-w-6xl flex-col justify-center px-4 pb-20 pt-24 sm:px-6 lg:pb-24 lg:pt-28">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.86fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#F26A2E]" aria-hidden />
                Tuition academy + recorded growth courses
              </div>

              <h1 className="mt-5 text-balance text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
                Unlock Your Child&apos;s Full Potential
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
                Personalized one-to-one tuition, remedial classes, mentoring,
                and recorded personal-development courses that help students
                learn with confidence.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  "Maths",
                  "Science",
                  "English",
                  "Public Speaking",
                  "Career Guidance",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white/90 backdrop-blur-md"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => scrollToEnquiry()}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-[#0B5ED7] shadow-lg transition hover:bg-blue-50"
                >
                  Enquire Now
                </button>
                <Link
                  href="/courses"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/60 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  View Recorded Courses
                </Link>
              </div>

              <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
                {[
                  ["1:1", "Personal attention"],
                  ["12/25", "Remedial plans"],
                  ["24/7", "Recorded access"],
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-white/15 bg-white/10 p-3 backdrop-blur-md"
                  >
                    <p className="text-2xl font-extrabold text-white">{value}</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-white/75">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden min-h-[34rem] lg:block">
              <div className="absolute right-0 top-0 w-[22rem] rounded-lg border border-white/18 bg-white/95 p-3 text-neutral-900 shadow-2xl">
                <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-neutral-100">
                  <Image
                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85"
                    alt=""
                    fill
                    className="object-cover"
                    sizes="360px"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"
                    aria-hidden
                  />
                  <div className="absolute bottom-3 left-3 rounded-lg bg-white/92 px-3 py-2 text-sm font-bold text-[#0B5ED7]">
                    Recorded Course Preview
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">Confidence Builder</p>
                    <p className="text-xs text-neutral-500">18 bite-sized lessons</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F26A2E] text-sm font-black text-white">
                    Play
                  </div>
                </div>
              </div>

              <div className="absolute bottom-7 left-0 w-[18rem] rounded-lg border border-white/18 bg-white p-5 text-neutral-900 shadow-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0B5ED7]">
                  Today&apos;s Tuition Plan
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    ["4:30 PM", "Maths concept clarity"],
                    ["5:15 PM", "Worksheet correction"],
                    ["6:00 PM", "Speaking practice"],
                  ].map(([time, title]) => (
                    <div key={title} className="flex gap-3">
                      <span className="w-16 text-sm font-bold text-[#F26A2E]">
                        {time}
                      </span>
                      <span className="text-sm font-medium text-neutral-700">
                        {title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-0 right-8 w-64 rounded-lg border border-white/20 bg-[#102A43]/95 p-4 text-white shadow-2xl">
                <p className="text-sm font-semibold text-white/75">
                  Parent progress note
                </p>
                <p className="mt-2 text-lg font-bold leading-snug">
                  Clearer basics, stronger confidence, steady follow-up.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="flex justify-center lg:justify-start">
            {founderImageFailed ? (
              <div className="flex h-72 w-72 items-center justify-center rounded-full bg-gradient-to-br from-[#0B5ED7] to-[#1a3a6b] text-7xl font-bold text-white shadow-lg">
                {FOUNDER.name.charAt(0)}
              </div>
            ) : (
              <Image
                src={FOUNDER.photoPath}
                alt={FOUNDER.name}
                width={420}
                height={420}
                className="h-auto w-full max-w-sm rounded-3xl object-cover shadow-xl"
                onError={() => setFounderImageFailed(true)}
              />
            )}
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
              About the Founder
            </p>
            <h2 className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl">
              {FOUNDER.name}
            </h2>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              {FOUNDER.role}
            </p>
            <blockquote className="mt-5 border-l-4 border-orange-500 pl-4 text-lg italic leading-relaxed text-neutral-700">
              “{FOUNDER.quote}”
            </blockquote>
            <p className="mt-5 text-base leading-relaxed text-neutral-700">
              {FOUNDER.bio}
            </p>
            <Link
              href="/about"
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              Read More
            </Link>
          </div>
        </div>
      </section>

      <section id="programs" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
              Programs
            </p>
            <h2 className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl">
              Personalized support for every stage of learning
            </h2>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {STATIC_PROGRAMS.map((program, index) => (
            <motion.article
              key={program.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex h-full flex-col rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="text-4xl">{program.icon}</div>
              <h3 className="mt-4 text-xl font-semibold text-neutral-900">
                {program.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-6 text-neutral-600">
                {program.description}
              </p>
              <button
                type="button"
                onClick={() => openEnquiry(program.interest, program.message)}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                Enquire Now
              </button>
            </motion.article>
          ))}
        </div>

        {courses.length > 0 ? (
          <div className="mt-14">
            <h3 className="text-2xl font-bold text-neutral-900">Recorded Courses</h3>
            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course, index) => (
                <motion.article
                  key={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
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
                    <h4 className="text-lg font-semibold text-neutral-900">
                      {course.title}
                    </h4>
                    <p className="text-sm font-semibold text-[#0B5ED7]">
                      {formatPrice(course.price)}
                    </p>
                    <Link
                      href={`/courses/${course.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
                    >
                      View Course
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section id="teachers" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">
          Teachers
        </p>
        <h2 className="mt-3 text-3xl font-bold text-neutral-900 sm:text-4xl">
          Learn with experienced mentors and subject experts
        </h2>

        {loadingTeachers ? (
          <p className="mt-6 text-sm text-neutral-500">Loading teachers...</p>
        ) : teachers.length === 0 ? (
          <p className="mt-6 text-sm text-neutral-600">
            Our expert team is coming soon
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {teachers.map((teacher, index) => (
              <motion.article
                key={teacher.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
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

      <section className="bg-neutral-900 py-16 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/80">
            Join hundreds of students achieving their potential with Motiva Edus
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#25D366] px-6 py-3 text-base font-semibold text-white"
            >
              WhatsApp
            </a>
            <button
              type="button"
              onClick={() => scrollToEnquiry()}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0B5ED7] px-6 py-3 text-base font-semibold text-white"
            >
              Enquire Now
            </button>
          </div>

          <form
            id="enquiry-form"
            onSubmit={submitEnquiry}
            className="mt-8 grid gap-4 rounded-3xl border border-white/15 bg-white/5 p-5 md:grid-cols-2"
          >
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>Name</span>
              <input
                className="min-h-11 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>Mobile</span>
              <input
                className="min-h-11 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(event) => setMobile(event.target.value.replace(/\D/g, ""))}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>Program Interest</span>
              <select
                value={programInterest}
                onChange={(event) => setProgramInterest(event.target.value)}
                className="min-h-11 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white"
              >
                <option value="tuition">One-to-One Tuition</option>
                <option value="remedial">Remedial Classes</option>
                <option value="recorded_courses">Recorded Courses</option>
                <option value="career_counseling">Career Counseling</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-white">
              <span>Message (Optional)</span>
              <input
                className="min-h-11 w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/60"
                placeholder="Tell us what you need help with"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-white px-6 py-3 text-base font-semibold text-[#0B5ED7] disabled:opacity-60 md:col-span-2"
            >
              {sending ? "Sending..." : "Send Enquiry"}
            </button>

            {successMessage ? (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 md:col-span-2">
                {successMessage}
              </p>
            ) : null}

            {errorMessage ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 md:col-span-2">
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
              Empowering students to reach their full potential
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Navigation
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
              Legal
            </h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-neutral-700">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/refund">Refund Policy</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Connect
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
          © 2025 Motiva Edus. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
