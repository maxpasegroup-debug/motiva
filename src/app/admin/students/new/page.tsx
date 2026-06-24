import type { Metadata } from "next";
import { StaffStudentAccountForm } from "@/components/admin/StaffStudentAccountForm";

export const metadata: Metadata = {
  title: "Add student - Motiva Edus",
};

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add Student</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Create student and parent login credentials directly.
        </p>
      </div>
      <StaffStudentAccountForm />
    </div>
  );
}
