import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { AssignMentorForm } from "@/components/admin/AssignMentorForm";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AssignMentorPage({
  params,
}: {
  params: { leadId: string };
}) {
  const { leadId } = params;

  if (!UUID_RE.test(leadId)) notFound();

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true, name: true, phone: true, notes: true, type: true, status: true, flowType: true },
  });

  if (!lead) notFound();

  const [studentAccount, mentors, teachers, batches] = await Promise.all([
    prisma.studentAccount.findFirst({
      where: { mobile: lead.phone },
      select: {
        id: true,
        studentName: true,
        programType: true,
        mentorId: true,
        teacherId: true,
        batchId: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "mentor" },
      select: { id: true, name: true, email: true, mobile: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "teacher" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.batch.findMany({
      select: { id: true, name: true, duration: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!studentAccount) {
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-bold text-foreground">Assign Mentor</h1>
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
          <p className="text-sm font-medium text-yellow-800">
            No student account found for this lead. Please create the student account first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Assign Mentor</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Assign a mentor and teacher to {studentAccount.studentName}.
        </p>
      </div>
      <AssignMentorForm
        lead={{ id: lead.id, name: lead.name }}
        studentAccount={studentAccount}
        mentors={mentors}
        teachers={teachers}
        batches={batches}
      />
    </div>
  );
}
