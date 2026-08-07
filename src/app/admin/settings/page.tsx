import type { Metadata } from "next";
import { AdminSettingsPage } from "@/components/admin/AdminSettingsPage";

export const metadata: Metadata = {
  title: "Settings — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <AdminSettingsPage />;
}
