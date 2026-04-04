import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminShell } from "@/components/layout/AdminShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <AdminSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <AdminHeader />
          <div className="min-h-[50vh] flex-1 bg-neutral-50/90 px-4 py-6 sm:px-8 sm:py-8">
            {children}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
