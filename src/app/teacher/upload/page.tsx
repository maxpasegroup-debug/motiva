import type { Metadata } from "next";
import { TeacherUploadPage } from "@/components/views/TeacherUploadPage";

export const metadata: Metadata = {
  title: "Upload Lesson — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <TeacherUploadPage />;
}
