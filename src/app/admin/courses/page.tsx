import type { Metadata } from "next";
import { RecordedCoursesList } from "@/components/admin/RecordedCoursesList";

export const metadata: Metadata = {
  title: "Courses — Motiva Edus",
};

export default function Page() {
  return <RecordedCoursesList />;
}
