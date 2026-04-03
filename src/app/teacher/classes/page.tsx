import type { Metadata } from "next";
import { TeacherClassesPage } from "@/components/views/TeacherClassesPage";

export const metadata: Metadata = {
  title: "My Classes — Motiva Edus",
};

export default function Page() {
  return <TeacherClassesPage />;
}
