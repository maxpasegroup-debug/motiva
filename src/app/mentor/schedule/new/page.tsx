import { MentorScheduleForm } from "@/components/mentor/MentorScheduleForm";
import { requireMentorSession } from "@/server/mentor/auth";
import { getMentorStudents } from "@/server/mentor/data";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewMentorSchedulePage({
  searchParams,
}: {
  searchParams?: { studentId?: string };
}) {
  const session = requireMentorSession();
  const students = await getMentorStudents(session.userId);
  const teacherIds = Array.from(
    new Set(
      students
        .map((student) => student.teacherId)
        .filter((teacherId): teacherId is string => Boolean(teacherId)),
    ),
  );
  const teachers = teacherIds.length
    ? await prisma.user.findMany({
        where: {
          id: {
            in: teacherIds,
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Add Class</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Schedule a class for one of your assigned students.
        </p>
      </div>
      <MentorScheduleForm
        defaultStudentId={searchParams?.studentId ?? ""}
        students={students.map((student) => ({
          id: student.id,
          studentName: student.studentName,
          teacherId: student.teacherId ?? "",
          teacherName: student.teacher?.name ?? "Not assigned",
        }))}
        teachers={teachers}
      />
    </div>
  );
}
