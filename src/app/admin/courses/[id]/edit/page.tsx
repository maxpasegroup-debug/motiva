import type { Metadata } from "next";
import { RecordedCourseForm } from "@/components/admin/RecordedCourseForm";

type Props = { params: { id: string } };

export const metadata: Metadata = {
  title: "Edit course — Motiva Edus",
};

export default function Page({ params }: Props) {
  return <RecordedCourseForm mode="edit" courseId={params.id} />;
}
