import type { Metadata } from "next";
import { AdminReportsPage } from "@/components/admin/AdminReportsPage";

export const metadata: Metadata = {
  title: "Reports — Motiva Edus",
};

export default function Page() {
  return <AdminReportsPage />;
}
