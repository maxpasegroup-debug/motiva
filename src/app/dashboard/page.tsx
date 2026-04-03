import type { Metadata } from "next";
import { DashboardPage } from "@/components/views/DashboardPage";

export const metadata: Metadata = {
  title: "Dashboard — Motiva Edus",
};

export default function Page() {
  return <DashboardPage />;
}
