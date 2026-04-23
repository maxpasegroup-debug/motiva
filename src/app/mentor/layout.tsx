import { StaffPortalShell } from "@/components/layout/StaffPortalShell";
import { MentorNav } from "@/components/mentor/MentorNav";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffPortalShell allow={["mentor", "admin"]}>
      <div className="space-y-6">
        <MentorNav />
        {children}
      </div>
    </StaffPortalShell>
  );
}
