import { ParentShell } from "@/components/layout/ParentShell";
import { ParentNav } from "@/components/parent/ParentNav";

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ParentShell>
      <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        <div className="space-y-6">
          <ParentNav />
          {children}
        </div>
      </div>
    </ParentShell>
  );
}
