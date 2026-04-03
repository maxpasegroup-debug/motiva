import type { Metadata } from "next";
import { TeacherUploadPage } from "@/components/views/TeacherUploadPage";

export const metadata: Metadata = {
  title: "Upload Lesson — Motiva Edus",
};

export default function Page() {
  return <TeacherUploadPage />;
}
