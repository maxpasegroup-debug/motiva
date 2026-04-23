import { MentorDashboardView } from "@/components/mentor/MentorDashboardView";
import { formatDateTime } from "@/lib/mentor";
import { requireMentorSession } from "@/server/mentor/auth";
import { getMentorDashboardSnapshot } from "@/server/mentor/data";

export const dynamic = "force-dynamic";

export default async function MentorStudentsPage() {
  const session = requireMentorSession();
  const snapshot = await getMentorDashboardSnapshot(session.userId);

  const students = snapshot.students.map((student) => ({
    id: student.id,
    studentName: student.studentName,
    programType: student.programType,
    currentDay: student.batch?.progress?.currentDay ?? null,
    attendancePercentage: snapshot.attendancePercentages.get(student.id) ?? 0,
    lastActive: formatDateTime(student.updatedAt),
  }));

  return (
    <MentorDashboardView
      heading="My Students"
      subheading="A focused view of every student assigned to you."
      metrics={snapshot.metrics}
      students={students}
      classes={snapshot.todayClasses}
      hideClasses
    />
  );
}
