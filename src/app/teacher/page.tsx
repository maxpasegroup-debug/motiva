import type { Metadata } from "next";
import { TeacherDashboardPage } from "@/components/views/TeacherDashboardPage";

export const metadata: Metadata = {
  title: "Teacher — Motiva Edus",
};

export default function Page() {
  return <TeacherDashboardPage />;
}
