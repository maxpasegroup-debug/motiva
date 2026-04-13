"use client";

import { usePathname } from "next/navigation";
import { WhatsAppFloat } from "@/components/marketing/WhatsAppFloat";
import { Header } from "@/components/ui/Header";

export function AppShell() {
  const pathname = usePathname();
  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/student") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/teacher") ||
    pathname?.startsWith("/parent") ||
    pathname?.startsWith("/leads") ||
    pathname?.startsWith("/demo") ||
    pathname?.startsWith("/mentor")
  ) {
    return null;
  }
  return (
    <>
      <Header />
      <WhatsAppFloat />
    </>
  );
}
