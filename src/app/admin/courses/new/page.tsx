import type { Metadata } from "next";
import { RecordedCourseForm } from "@/components/admin/RecordedCourseForm";

export const metadata: Metadata = {
  title: "New course — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <RecordedCourseForm mode="new" />;
}
