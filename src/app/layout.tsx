import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Motiva Edus",
  description: "Simple classes for everyone. One-to-one, group, and recorded courses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LanguageProvider>
          <div className="flex min-h-screen flex-col bg-background">
            <AppShell />
            <main className="flex w-full flex-1 flex-col">{children}</main>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
