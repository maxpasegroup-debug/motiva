import type { Metadata } from "next";
import { TeacherAttendancePage } from "@/components/views/TeacherAttendancePage";

export const metadata: Metadata = {
  title: "Attendance — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <TeacherAttendancePage />;
}
