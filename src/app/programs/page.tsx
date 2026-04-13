import type { Metadata } from "next";
import { ProgramsMarketingPage } from "@/components/views/ProgramsMarketingPage";

export const metadata: Metadata = {
  title: "Programs — Motiva Edus",
  description:
    "One-to-one tuition, remedial programs, parenting, happiness, and career counseling at Motiva Edus.",
};

export default function Page() {
  return <ProgramsMarketingPage />;
}
