import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminLeadDetailPage } from "@/components/admin/AdminLeadDetailPage";

export const dynamic = "force-dynamic";

export default async function AdminLeadDetailRoute({
  params,
}: {
  params: { id: string };
}) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      demos: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  return (
    <AdminLeadDetailPage
      initialLead={{
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        type: lead.type,
        flowType: lead.flowType,
        status: lead.status,
        notes: lead.notes,
        createdAt: lead.createdAt.toISOString(),
        demos: lead.demos.map((demo) => ({
          id: demo.id,
          status: demo.status,
          result: demo.result,
          notes: demo.notes,
          createdAt: demo.createdAt.toISOString(),
        })),
      }}
    />
  );
}
