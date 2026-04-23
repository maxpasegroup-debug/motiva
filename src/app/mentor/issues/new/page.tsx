import { MentorIssueForm } from "@/components/mentor/MentorIssueForm";
import { requireMentorSession } from "@/server/mentor/auth";
import { getMentorStudents } from "@/server/mentor/data";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewMentorIssuePage({
  searchParams,
}: {
  searchParams?: { studentId?: string };
}) {
  const session = requireMentorSession();
  const [students, assignableUsers] = await Promise.all([
    getMentorStudents(session.userId),
    prisma.user.findMany({
      where: {
        role: {
          in: ["mentor", "teacher"],
        },
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Raise New Issue</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Capture student concerns and route them to the right person.
        </p>
      </div>
      <MentorIssueForm
        defaultStudentId={searchParams?.studentId ?? ""}
        currentUserId={session.userId}
        students={students.map((student) => ({
          id: student.id,
          studentName: student.studentName,
        }))}
        assignees={assignableUsers}
      />
    </div>
  );
}
