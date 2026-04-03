import type { Metadata } from "next";
import { AdminCoursesPage } from "@/components/admin/AdminCoursesPage";

export const metadata: Metadata = {
  title: "Courses — Motiva Edus",
};

export default function Page() {
  return <AdminCoursesPage />;
}
