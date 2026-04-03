import type { Metadata } from "next";
import { AdminClassesPage } from "@/components/admin/AdminClassesPage";

export const metadata: Metadata = {
  title: "Batches — Motiva Edus",
};

export default function Page() {
  return <AdminClassesPage />;
}
