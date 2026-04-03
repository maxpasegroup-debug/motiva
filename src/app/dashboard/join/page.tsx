import type { Metadata } from "next";
import { DashboardJoinPage } from "@/components/views/DashboardJoinPage";

export const metadata: Metadata = {
  title: "Join Class — Motiva Edus",
};

export default function Page() {
  return <DashboardJoinPage />;
}
