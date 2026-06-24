import type { Metadata } from "next";
import { RecordedCoursesList } from "@/components/admin/RecordedCoursesList";

export const metadata: Metadata = {
  title: "Courses — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <RecordedCoursesList />;
}
