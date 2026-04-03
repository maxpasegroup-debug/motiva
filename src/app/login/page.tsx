import type { Metadata } from "next";
import { LoginPage } from "@/components/views/LoginPage";

export const metadata: Metadata = {
  title: "Login — Motiva Edus",
};

export default function Page() {
  return <LoginPage />;
}
