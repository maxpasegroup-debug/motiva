import type { Metadata } from "next";
import { DashboardSubPage } from "@/components/views/DashboardSubPage";

export const metadata: Metadata = {
  title: "Help — Motiva Edus",
};

export default function Page() {
  return <DashboardSubPage titleKey="help" emoji="📞" />;
}
