import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
  description:
    "Personal mentorship and structured learning—one-to-one tuition, group classes, and programs that build confident students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0B5ED7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <LanguageProvider>
          <div className="flex min-h-screen flex-col bg-background">
            <AppShell />
            <main className="flex w-full flex-1 flex-col">{children}</main>
          </div>
        </LanguageProvider>
        <Script id="service-worker-register" strategy="afterInteractive">
          {`
            if (
              typeof window !== 'undefined' &&
              'serviceWorker' in navigator &&
              window.location.hostname !== 'localhost' &&
              window.location.hostname !== '127.0.0.1'
            ) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').catch(function () {});
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
