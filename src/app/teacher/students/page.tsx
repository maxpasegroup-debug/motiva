import type { Metadata } from "next";
import { TeacherStudentsPage } from "@/components/views/TeacherStudentsPage";

export const metadata: Metadata = {
  title: "My Students — Motiva Edus",
};

export default function Page() {
  return <TeacherStudentsPage />;
}
