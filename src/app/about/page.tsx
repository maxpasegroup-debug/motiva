import type { Metadata } from "next";
import { AboutPage } from "@/components/views/AboutPage";

export const metadata: Metadata = {
  title: "About Us — Motiva Edus",
  description: "Learn about Motiva Edus, our mission, vision, and leadership.",
};

export default function Page() {
  return <AboutPage />;
}
