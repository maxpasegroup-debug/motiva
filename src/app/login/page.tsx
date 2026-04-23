import type { Metadata } from "next";
import { InternalLoginPage } from "@/components/auth/InternalLoginPage";

export const metadata: Metadata = {
  title: "Internal Login - Motiva Edus",
};

export default function Page() {
  return <InternalLoginPage />;
}
