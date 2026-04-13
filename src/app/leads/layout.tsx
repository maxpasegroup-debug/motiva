import { StaffPortalShell } from "@/components/layout/StaffPortalShell";

export default function LeadsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffPortalShell allow={["telecounselor", "admin"]}>
      {children}
    </StaffPortalShell>
  );
}
