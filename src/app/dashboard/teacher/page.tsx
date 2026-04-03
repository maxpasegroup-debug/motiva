import type { Metadata } from "next";
import { DashboardSubPage } from "@/components/views/DashboardSubPage";

export const metadata: Metadata = {
  title: "My Teacher — Motiva Edus",
};

export default function Page() {
  return <DashboardSubPage titleKey="my_teacher" emoji="👨‍🏫" />;
}
