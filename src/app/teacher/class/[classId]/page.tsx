"use client";

import { useParams } from "next/navigation";
import { TeacherClassPage } from "@/components/views/TeacherClassPage";

export default function Page() {
  const params = useParams();
  const classId = params.classId as string;
  return <TeacherClassPage classId={classId} />;
}
