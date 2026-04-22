import Link from "next/link";
import prisma from "@/lib/prisma";
import { CreateAccountForm } from "@/components/admin/CreateAccountForm";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CreateAccountPage({
  searchParams,
}: {
  searchParams: { leadId?: string };
}) {
  const leadId = searchParams.leadId?.trim() ?? "";

  if (!leadId || !UUID_RE.test(leadId)) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
        <p className="text-sm font-medium text-red-600">Lead not found</p>
      </div>
    );
  }

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      name: true,
      phone: true,
      notes: true,
      status: true,
      type: true,
    },
  });

  if (!lead) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
        <p className="text-sm font-medium text-red-600">Lead not found</p>
      </div>
    );
  }

  if (lead.status !== "payment_confirmed") {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
          <p className="text-sm font-medium text-yellow-800">
            Payment must be confirmed before creating account
          </p>
        </div>
        <Link
          href={`/admin/leads/${lead.id}`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
        >
          Back to Lead
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Create student and parent credentials after payment confirmation.
        </p>
      </div>
      <CreateAccountForm
        lead={{
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          notes: lead.notes,
          type: lead.type,
        }}
      />
    </div>
  );
}
