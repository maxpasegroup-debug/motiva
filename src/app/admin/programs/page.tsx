import type { Metadata } from "next";
import { AdminProgramsPage } from "@/components/admin/AdminProgramsPage";

export const metadata: Metadata = {
  title: "Programs — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <AdminProgramsPage />;
}
