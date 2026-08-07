import type { Metadata } from "next";
import { TeacherProfileForm } from "@/components/admin/TeacherProfileForm";

export const metadata: Metadata = {
  title: "Add teacher — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <TeacherProfileForm mode="new" />;
}
