import type { Metadata } from "next";
import { TeacherClassesPage } from "@/components/views/TeacherClassesPage";

export const metadata: Metadata = {
  title: "My Classes — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <TeacherClassesPage />;
}
