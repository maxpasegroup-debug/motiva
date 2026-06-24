"use client";

import { useParams } from "next/navigation";
import { StudentClassPage } from "@/components/views/StudentClassPage";

export const dynamic = "force-dynamic";

export default function Page() {
  const params = useParams();
  const classId = params.classId as string;
  return <StudentClassPage classId={classId} />;
}
