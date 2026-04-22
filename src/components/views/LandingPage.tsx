"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

const STATIC_PROGRAMS = [
  {
    id: "one-to-one tuition",
    icon: "🎯",
    title: "One-to-One Tuition",
    description: "Personalized tutoring focused on your child’s strengths and gaps.",
  },
  {
    id: "remedial",
    icon: "🧠",
    title: "Remedial Classes (12 & 25 days)",
    description: "Structured short-term improvement plans with measurable outcomes.",
  },
  {
    id: "public-speaking",
    icon: "🎤",
    title: "Public Speaking Training",
    description: "Build confidence, voice clarity, and stage presence through guided practice.",
  },
  {
    id: "career-counseling",
    icon: "🧭",
    title: "Career Counseling",
    description: "Goal-oriented guidance to choose the right stream and career path.",
  },
] as const;

function formatPrice(price: number): string {
  if (price <= 0) return "Free";
  return `Rs ${price.toFixed(0)}`;
}

export function LandingPage({ courses }: { courses: PublicCourse[] }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [programInterest, setProgramInterest] = useState("one-to-one tuition");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/teachers")
      .then((r) => r.json())
      .then((j: { teachers?: Teacher[] }) => {
        if (!cancelled) setTeachers(j.teachers ?? []);
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

  const hasRecorded = useMemo(() => courses.length > 0, [courses.length]);

  async function submitEnquiry(e: FormEvent) {
    e.preventDefault();
    setFormMsg(null);
    setSending(true);
    const res = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        mobile,
        programInterest,
        message,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setFormMsg(json.error || "Could not submit enquiry.");
      setSending(false);
      return;
    }
    setFormMsg("Enquiry submitted successfully.");
    setName("");
    setMobile("");
    setProgramInterest("one-to-one tuition");
    setMessage("");
    setSending(false);
  }

  return (
    <main className="w-full">
      <section className="relative min-h-[70vh] overflow-hidden">
        <Image
          src="/images/hero-students.jpg"
          alt="Students learning"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-black/35" />
        <div className="relative z-10 mx-auto flex min-h-[70vh] w-full max-w-6xl items-center px-4 py-14 sm:px-6">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Unlock Your Child&apos;s Full Potential
            </h1>
            <p className="mt-5 text-lg text-white/90 sm:text-xl">
              Personalized one-to-one tuition, remedial programs, and recorded
              courses — guided by dedicated mentors.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white shadow-md"
              >
                Enquire Now
              </button>
              <Link
                href="/courses"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/60 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur"
              >
                View Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 py-14 sm:px-6 md:grid-cols-2">
        <div className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm">
          <Image
            src="/md.jpg"
            alt="Founder"
            width={500}
            height={620}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="self-center">
          <h2 className="text-3xl font-bold text-neutral-900">About the Founder</h2>
          <p className="mt-3 text-xl font-semibold text-primary">Shafeeque Elettil</p>
          <p className="mt-1 text-sm font-medium text-neutral-500">
            Managing Director, Motiva Edus
          </p>
          <p className="mt-4 text-base leading-relaxed text-neutral-700">
            At Motiva Edus, every student matters. Our team is committed to clear
            teaching, steady encouragement, and paths that help learners grow with
            pride in class and in life.
          </p>
          <Link href="/about" className="mt-4 inline-block font-semibold text-primary">
            Read More →
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-3xl font-bold text-neutral-900">Programs</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STATIC_PROGRAMS.map((p, idx) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <p className="text-3xl">{p.icon}</p>
              <h3 className="mt-2 text-lg font-semibold text-neutral-900">{p.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{p.description}</p>
              <button
                type="button"
                onClick={() => {
                  setProgramInterest(p.id);
                  setShowForm(true);
                }}
                className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-neutral-200 px-4 text-sm font-semibold"
              >
                Enquire
              </button>
            </motion.article>
          ))}
        </div>

        {hasRecorded ? (
          <div className="mt-10">
            <h3 className="text-2xl font-bold text-neutral-900">Recorded Courses</h3>
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08 } },
              }}
              className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {courses.map((course) => (
                <motion.article
                  key={course.id}
                  variants={{
                    hidden: { opacity: 0, y: 24 },
                    show: { opacity: 1, y: 0 },
                  }}
                  className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
                >
                  <div className="aspect-video w-full bg-neutral-100">
                    {course.thumbnail ? (
                      <Image
                        src={course.thumbnail}
                        alt={course.title}
                        width={400}
                        height={225}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-2 p-4">
                    <h4 className="line-clamp-2 text-lg font-semibold text-neutral-900">
                      {course.title}
                    </h4>
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(course.price)}
                    </p>
                    <Link
                      href={`/courses/${course.id}`}
                      className="inline-flex min-h-10 items-center rounded-lg border border-neutral-200 px-4 text-sm font-semibold"
                    >
                      View Course
                    </Link>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        ) : null}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-3xl font-bold text-neutral-900">Our Teachers</h2>
        {loadingTeachers ? (
          <p className="mt-4 text-sm text-neutral-500">Loading teachers...</p>
        ) : teachers.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">Meet our team coming soon</p>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {teachers.map((teacher) => (
              <motion.article
                key={teacher.id}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0 },
                }}
                className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="h-20 w-20 overflow-hidden rounded-full bg-neutral-100">
                  {teacher.photo ? (
                    <Image
                      src={teacher.photo}
                      alt={teacher.name}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-neutral-900">{teacher.name}</h3>
                <p className="text-sm font-medium text-primary">{teacher.subject}</p>
                <p className="mt-2 text-sm text-neutral-600">{teacher.bio || ""}</p>
              </motion.article>
            ))}
          </motion.div>
        )}
      </section>

      <section id="enquiry" className="bg-neutral-900 py-14 text-white">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref("Hi, I would like to get started with Motiva Edus.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#25D366] px-6 text-base font-semibold text-white"
            >
              WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/40 px-6 text-base font-semibold"
            >
              Enquire Now
            </button>
          </div>

          {showForm ? (
            <form
              onSubmit={submitEnquiry}
              className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-white/15 bg-white/5 p-4 sm:grid-cols-2"
            >
              <input
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/60"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/60"
                placeholder="Mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
              <select
                value={programInterest}
                onChange={(e) => setProgramInterest(e.target.value)}
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-white"
              >
                <option value="one-to-one tuition">one-to-one tuition</option>
                <option value="remedial">remedial</option>
                <option value="recorded courses">recorded courses</option>
                <option value="career counseling">career counseling</option>
                <option value="other">other</option>
              </select>
              <input
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/60"
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                type="submit"
                disabled={sending}
                className="sm:col-span-2 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white disabled:opacity-60"
              >
                {sending ? "Submitting..." : "Submit Enquiry"}
              </button>
              {formMsg ? <p className="sm:col-span-2 text-sm">{formMsg}</p> : null}
            </form>
          ) : null}
        </div>
      </section>

      <footer className="border-t border-neutral-200 bg-white py-12">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 md:grid-cols-4">
          <div>
            <Image src="/logo.png" alt="Motiva Edus" width={120} height={40} />
            <p className="mt-3 text-sm text-neutral-600">
              Personalized learning for confident futures.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Links
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/programs">Programs</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/courses">Courses</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Legal
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
              <li><Link href="/refund">Refund Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Social
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
              <li><a href="#" aria-label="Instagram">Instagram</a></li>
              <li><a href="#" aria-label="Facebook">Facebook</a></li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-8 w-full max-w-6xl px-4 text-xs text-neutral-500 sm:px-6">
          © 2025 Motiva Edus. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
