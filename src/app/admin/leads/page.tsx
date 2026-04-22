import Link from "next/link";
import prisma from "@/lib/prisma";
import {
  FLOW_TYPE_BADGE_CLASS,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
  normalizeLeadFlowType,
  normalizeLeadStatus,
} from "@/lib/leads";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Track tuition and remedial leads across the full admission pipeline.
          </p>
        </div>
        <Link
          href="/admin/admissions/remedial"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          New Remedial Admission
        </Link>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 sm:px-6">Lead</th>
                <th className="px-4 py-3 sm:px-6">Phone</th>
                <th className="px-4 py-3 sm:px-6">Type</th>
                <th className="px-4 py-3 sm:px-6">Status</th>
                <th className="px-4 py-3 sm:px-6">Created</th>
                <th className="px-4 py-3 text-right sm:px-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white">
              {leads.map((lead) => {
                const flowType = normalizeLeadFlowType(lead.flowType);
                const status = normalizeLeadStatus(lead.status);
                return (
                  <tr key={lead.id} className="align-top">
                    <td className="px-4 py-4 sm:px-6">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {lead.name}
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${FLOW_TYPE_BADGE_CLASS[flowType]}`}
                          >
                            {flowType}
                          </span>
                        </div>
                        {lead.subjects ? (
                          <p className="text-sm text-neutral-500">{lead.subjects}</p>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-700 sm:px-6">
                      {lead.phone}
                    </td>
                    <td className="px-4 py-4 text-sm capitalize text-neutral-700 sm:px-6">
                      {lead.type}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-500 sm:px-6">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right sm:px-6">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
