import type { Metadata } from "next";
import { AdminProgramsPage } from "@/components/admin/AdminProgramsPage";

export const metadata: Metadata = {
  title: "Programs — Motiva Edus",
};

export default function Page() {
  return <AdminProgramsPage />;
}
