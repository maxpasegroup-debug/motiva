import type { Metadata } from "next";
import { AdminClassesPage } from "@/components/admin/AdminClassesPage";

export const metadata: Metadata = {
  title: "Batches — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <AdminClassesPage />;
}
