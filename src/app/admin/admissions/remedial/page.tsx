import { AdminRemedialAdmissionForm } from "@/components/admin/AdminRemedialAdmissionForm";

export const dynamic = "force-dynamic";

export default function AdminRemedialAdmissionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">New Remedial Admission</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Create a direct remedial admission that skips demo and counseling and
          moves straight into payment processing.
        </p>
      </div>
      <AdminRemedialAdmissionForm />
    </div>
  );
}
