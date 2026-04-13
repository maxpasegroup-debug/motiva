import type { Metadata } from "next";
import { MentorDashboardPage } from "@/components/views/MentorDashboardPage";

export const metadata: Metadata = {
  title: "Mentor — Motiva Edus",
};

export default function Page() {
  return <MentorDashboardPage />;
}
