"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { whatsappHref } from "@/components/marketing/whatsapp";

export function ContactPage() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [program, setProgram] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body = [
      `${t("contact_wa_name")}: ${name.trim()}`,
      `${t("contact_wa_phone")}: ${phone.trim()}`,
      `${t("contact_wa_program")}: ${program.trim() || "—"}`,
      `${t("contact_wa_message")}: ${message.trim() || "—"}`,
    ].join("\n");
    window.location.href = whatsappHref(body);
  }

  return (
    <div className="min-h-[80vh] w-full bg-gradient-to-b from-slate-50 via-white to-blue-50/50">
      <section className="border-b border-neutral-200/80 bg-gradient-to-r from-[#0B5ED7] to-[#1565C8] px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            {t("contact_title")}
          </h1>
          <p className="mt-3 text-base text-white/90 sm:text-lg">
            {t("contact_subtitle")}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-14">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.15)] sm:p-10"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-800">
              {t("contact_name")}
            </span>
            <input
              required
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-base outline-none ring-primary transition-shadow focus:border-primary focus:ring-2"
            />
          </label>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold text-neutral-800">
              {t("contact_phone")}
            </span>
            <input
              required
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-base outline-none ring-primary transition-shadow focus:border-primary focus:ring-2"
            />
          </label>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold text-neutral-800">
              {t("contact_program")}
            </span>
            <input
              name="program"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              placeholder={t("contact_program_placeholder")}
              className="min-h-14 w-full rounded-xl border border-neutral-300 px-4 text-base outline-none ring-primary transition-shadow focus:border-primary focus:ring-2"
            />
          </label>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold text-neutral-800">
              {t("contact_message")}
            </span>
            <textarea
              name="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none ring-primary transition-shadow focus:border-primary focus:ring-2"
            />
          </label>
          <Button type="submit" className="mt-8 min-h-[3.5rem] w-full text-lg">
            {t("contact_submit")}
          </Button>
          <p className="mt-4 text-center text-xs text-neutral-500">
            {t("contact_whatsapp_note")}
          </p>
        </form>

        <p className="mt-10 text-center">
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
