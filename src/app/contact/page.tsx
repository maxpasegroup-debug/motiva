import type { Metadata } from "next";
import { ContactPage } from "@/components/views/ContactPage";

export const metadata: Metadata = {
  title: "Contact — Motiva Edus",
  description: "Get in touch with Motiva Edus via WhatsApp.",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <ContactPage />;
}
