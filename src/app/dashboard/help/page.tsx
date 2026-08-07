import type { Metadata } from "next";
import { DashboardSubPage } from "@/components/views/DashboardSubPage";

export const metadata: Metadata = {
  title: "Help — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <DashboardSubPage titleKey="help" emoji="📞" />;
}
