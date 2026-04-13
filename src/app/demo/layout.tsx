import { StaffPortalShell } from "@/components/layout/StaffPortalShell";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffPortalShell allow={["demo_executive", "admin"]}>
      {children}
    </StaffPortalShell>
  );
}
