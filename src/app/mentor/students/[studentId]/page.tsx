import { redirect } from "next/navigation";
import { MentorStudentDetailView } from "@/components/mentor/MentorStudentDetailView";
import {
  formatDate,
  parseIssueTimeline,
  parseLearningPlanSubjects,
} from "@/lib/mentor";
import { requireMentorSession } from "@/server/mentor/auth";
import { getMentorStudentDetail } from "@/server/mentor/data";

export const dynamic = "force-dynamic";

export default async function MentorStudentDetailPage({
  params,
  searchParams,
}: {
  params: { studentId: string };
  searchParams?: { tab?: string };
}) {
  const session = requireMentorSession();
  const detail = await getMentorStudentDetail(session.userId, params.studentId);

  if (!detail) {
    redirect("/mentor");
  }

  const latestPlan = detail.student.learningPlans[0] ?? null;
  const primaryParent = detail.student.parentAccounts[0] ?? null;
  const attendanceMap = new Map(
    detail.attendanceRecords.map((record) => [record.dayNumber, record.status]),
  );

  const attendanceDots = Array.from({ length: detail.totalCalendarDays }, (_, index) => {
    const day = index + 1;
    return {
      day,
      status: attendanceMap.get(day) ?? "no_class",
    };
  });

  return (
    <MentorStudentDetailView
      initialTab={searchParams?.tab ?? "overview"}
      student={{
        id: detail.student.id,
        studentName: detail.student.studentName,
        programType: detail.student.programType,
        mobile: detail.student.mobile,
        admissionStatus: detail.student.admissionStatus,
        teacherName: detail.student.teacher?.name ?? "Not assigned",
        batchName: detail.student.batch?.name ?? "Not assigned",
        parentName: primaryParent?.name ?? detail.student.parentName,
        parentMobile: primaryParent?.mobile ?? "Not available",
        learningPlanStatus: latestPlan?.status ?? "No learning plan yet",
      }}
      attendance={{
        percentage: detail.attendancePercentage,
        dots: attendanceDots,
      }}
      learningPlan={
        latestPlan
          ? {
              id: latestPlan.id,
              status: latestPlan.status,
              startDate: formatDate(latestPlan.startDate),
              endDate: formatDate(latestPlan.endDate),
              goals: latestPlan.goals ?? "",
              revisionCycle: latestPlan.revisionCycle ?? "",
              notes: latestPlan.notes ?? "",
              subjects: parseLearningPlanSubjects(latestPlan.subjects),
            }
          : null
      }
      issues={detail.student.issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        category: issue.category ?? "other",
        status: issue.status,
        createdAt: formatDate(issue.createdAt),
        timelineCount: parseIssueTimeline(issue.timeline).length,
      }))}
    />
  );
}
