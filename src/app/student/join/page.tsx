import type { Metadata } from "next";
import { DashboardJoinPage } from "@/components/views/DashboardJoinPage";

export const metadata: Metadata = {
  title: "Join class — Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return <DashboardJoinPage />;
}
