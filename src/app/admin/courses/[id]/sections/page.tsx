import type { Metadata } from "next";
import { RecordedCourseSectionsManager } from "@/components/admin/RecordedCourseSectionsManager";

type Props = { params: { id: string } };

export const metadata: Metadata = {
  title: "Course sections — Motiva Edus",
};

export default function Page({ params }: Props) {
  return <RecordedCourseSectionsManager courseId={params.id} />;
}
