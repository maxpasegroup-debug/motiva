"use client";

import { useParams } from "next/navigation";
import { TeacherClassPage } from "@/components/views/TeacherClassPage";

export const dynamic = "force-dynamic";

export default function Page() {
  const params = useParams();
  const classId = params.classId as string;
  return <TeacherClassPage classId={classId} />;
}
