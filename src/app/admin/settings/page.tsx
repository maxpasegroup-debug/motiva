import type { Metadata } from "next";
import { AdminSettingsPage } from "@/components/admin/AdminSettingsPage";

export const metadata: Metadata = {
  title: "Settings — Motiva Edus",
};

export default function Page() {
  return <AdminSettingsPage />;
}
