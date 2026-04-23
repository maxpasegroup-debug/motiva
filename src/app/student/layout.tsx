import { DashboardShell } from "@/components/layout/DashboardShell";
import { StudentNav } from "@/components/student/StudentNav";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        <div className="space-y-6">
          <StudentNav />
          {children}
        </div>
      </div>
    </DashboardShell>
  );
}
