import type { Metadata } from "next";
import { AdminParentsPage } from "@/components/admin/AdminParentsPage";

export const metadata: Metadata = {
  title: "Parents — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <AdminParentsPage />;
}
