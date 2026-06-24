import type { Metadata } from "next";
import { TelecounselorLeadsPage } from "@/components/views/TelecounselorLeadsPage";

export const metadata: Metadata = {
  title: "Leads — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <TelecounselorLeadsPage />;
}
