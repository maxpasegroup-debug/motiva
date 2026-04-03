import type { Metadata } from "next";
import { DashboardLessonsPage } from "@/components/views/DashboardLessonsPage";

export const metadata: Metadata = {
  title: "My Lessons — Motiva Edus",
};

export default function Page() {
  return <DashboardLessonsPage />;
}
