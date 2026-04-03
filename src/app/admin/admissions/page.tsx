import type { Metadata } from "next";
import { AdminAdmissionsPage } from "@/components/admin/AdminAdmissionsPage";

export const metadata: Metadata = {
  title: "Admissions — Motiva Edus",
};

export default function Page() {
  return <AdminAdmissionsPage />;
}
