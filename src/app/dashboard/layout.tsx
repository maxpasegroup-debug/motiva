import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        {children}
      </div>
    </DashboardShell>
  );
}
