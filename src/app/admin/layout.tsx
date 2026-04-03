import { AdminShell } from "@/components/layout/AdminShell";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <AdminSidebar />
        <div className="min-h-[50vh] flex-1 bg-neutral-50/90 px-4 py-8 sm:px-8 sm:py-10">
          {children}
        </div>
      </div>
    </AdminShell>
  );
}
