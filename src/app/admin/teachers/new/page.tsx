import type { Metadata } from "next";
import { TeacherProfileForm } from "@/components/admin/TeacherProfileForm";

export const metadata: Metadata = {
  title: "Add teacher — Motiva Edus",
};

export default function Page() {
  return <TeacherProfileForm mode="new" />;
}
