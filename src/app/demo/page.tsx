import type { Metadata } from "next";
import { DemoExecutivePage } from "@/components/views/DemoExecutivePage";

export const metadata: Metadata = {
  title: "Demos — Motiva Edus",
};

export default function Page() {
  return <DemoExecutivePage />;
}
