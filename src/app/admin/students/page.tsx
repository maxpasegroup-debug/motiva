import type { Metadata } from "next";
import { AdminStudentsPage } from "@/components/admin/AdminStudentsPage";

export const metadata: Metadata = {
  title: "Students — Motiva Edus",
};

export default function Page() {
  return <AdminStudentsPage />;
}
