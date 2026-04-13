import { StaffPortalShell } from "@/components/layout/StaffPortalShell";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffPortalShell allow={["mentor", "admin"]}>
      {children}
    </StaffPortalShell>
  );
}
