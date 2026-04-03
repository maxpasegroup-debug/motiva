import type { Metadata } from "next";
import { AdminPaymentsPage } from "@/components/admin/AdminPaymentsPage";

export const metadata: Metadata = {
  title: "Payments — Motiva Edus",
};

export default function Page() {
  return <AdminPaymentsPage />;
}
