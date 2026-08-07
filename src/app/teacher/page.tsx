import type { Metadata } from "next";
import { TeacherDashboardPage } from "@/components/views/TeacherDashboardPage";

export const metadata: Metadata = {
  title: "Teacher — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <TeacherDashboardPage />;
}
