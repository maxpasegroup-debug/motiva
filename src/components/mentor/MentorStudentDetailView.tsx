"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getAttendanceTone,
  getCategoryClasses,
  getIssueStatusClasses,
  humanizeSnakeCase,
} from "@/lib/mentor";

type OverviewStudent = {
  id: string;
  studentName: string;
  programType: string;
  mobile: string;
  admissionStatus: string;
  teacherName: string;
  batchName: string;
  parentName: string;
  parentMobile: string;
  learningPlanStatus: string;
};

type AttendanceDot = {
  day: number;
  status: string;
};

type LearningPlanView = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  goals: string;
  revisionCycle: string;
  notes: string;
  subjects: {
    subjectName: string;
    dailyTargetMinutes: number;
    notes: string;
  }[];
};

type IssueRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  createdAt: string;
  timelineCount: number;
};

type Props = {
  initialTab: string;
  student: OverviewStudent;
  attendance: {
    percentage: number;
    dots: AttendanceDot[];
  };
  learningPlan: LearningPlanView | null;
  issues: IssueRow[];
};

const TAB_OPTIONS = [
  { key: "overview", label: "Overview" },
  { key: "attendance", label: "Attendance" },
  { key: "plan", label: "Learning Plan" },
  { key: "issues", label: "Issues" },
];

export function MentorStudentDetailView({
  initialTab,
  student,
  attendance,
  learningPlan,
  issues,
}: Props) {
  const defaultTab = TAB_OPTIONS.some((tab) => tab.key === initialTab)
    ? initialTab
    : "overview";
  const [activeTab, setActiveTab] = useState(defaultTab);

  const content = useMemo(() => {
    if (activeTab === "attendance") {
      return (
        <section className="space-y-5">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <p className="text-sm text-neutral-500">Attendance Percentage</p>
            <p className={`mt-2 text-3xl font-bold ${getAttendanceTone(attendance.percentage)}`}>
              {attendance.percentage}%
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="grid grid-cols-7 gap-3 sm:grid-cols-10 lg:grid-cols-12">
              {attendance.dots.map((dot) => (
                <div key={dot.day} className="flex flex-col items-center gap-2">
                  <span
                    className={`h-4 w-4 rounded-full ${
                      dot.status === "present"
                        ? "bg-emerald-500"
                        : dot.status === "absent"
                          ? "bg-rose-500"
                          : "bg-neutral-300"
                    }`}
                    title={`Day ${dot.day}: ${humanizeSnakeCase(dot.status)}`}
                  />
                  <span className="text-xs text-neutral-500">D{dot.day}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (activeTab === "plan") {
      return learningPlan ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <div>
              <p className="text-sm text-neutral-500">Plan Status</p>
              <p className="mt-2 text-lg font-semibold text-neutral-900">
                {humanizeSnakeCase(learningPlan.status)}
              </p>
            </div>
            <Link
              href={`/mentor/students/${student.id}/plan`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Edit Plan
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard label="Start Date" value={learningPlan.startDate} />
            <InfoCard label="End Date" value={learningPlan.endDate} />
            <InfoCard
              label="Revision Cycle"
              value={humanizeSnakeCase(learningPlan.revisionCycle)}
            />
            <InfoCard label="Goals" value={learningPlan.goals || "Not added"} />
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-neutral-900">Subjects</h3>
            <div className="mt-4 space-y-3">
              {learningPlan.subjects.map((subject) => (
                <div
                  key={`${subject.subjectName}-${subject.dailyTargetMinutes}`}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-neutral-900">{subject.subjectName}</p>
                    <span className="text-sm text-neutral-500">
                      {subject.dailyTargetMinutes} min/day
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">
                    {subject.notes || "No notes for this subject."}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-600">
              {learningPlan.notes || "No additional mentor notes."}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6">
          <h3 className="text-lg font-semibold text-neutral-900">No learning plan yet</h3>
          <p className="mt-2 text-sm text-neutral-500">
            Create the first structured plan for this student.
          </p>
          <Link
            href={`/mentor/students/${student.id}/plan`}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Create Plan
          </Link>
        </section>
      );
    }

    if (activeTab === "issues") {
      return (
        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">Student Issues</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Track open concerns and their progress.
              </p>
            </div>
            <Link
              href={`/mentor/issues/new?studentId=${student.id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Raise New Issue
            </Link>
          </div>
          <div className="space-y-3">
            {issues.length > 0 ? (
              issues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/mentor/issues/${issue.id}`}
                  className="block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-neutral-900">{issue.title}</h4>
                      <p className="mt-1 text-sm text-neutral-500">
                        Created {issue.createdAt}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getCategoryClasses(issue.category)}`}>
                        {humanizeSnakeCase(issue.category)}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getIssueStatusClasses(issue.status)}`}>
                        {humanizeSnakeCase(issue.status)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
                No issues have been raised for this student yet.
              </div>
            )}
          </div>
        </section>
      );
    }

    return (
      <section className="grid gap-4 md:grid-cols-2">
        <InfoCard label="Student Name" value={student.studentName} />
        <InfoCard label="Program Type" value={student.programType} />
        <InfoCard label="Mobile" value={student.mobile} />
        <InfoCard label="Admission Status" value={humanizeSnakeCase(student.admissionStatus)} />
        <InfoCard label="Assigned Teacher" value={student.teacherName} />
        <InfoCard label="Batch" value={student.batchName} />
        <InfoCard label="Parent Name" value={student.parentName} />
        <InfoCard label="Parent Mobile" value={student.parentMobile} />
        <InfoCard
          label="Learning Plan Status"
          value={humanizeSnakeCase(student.learningPlanStatus)}
        />
      </section>
    );
  }, [activeTab, attendance, issues, learningPlan, student]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/mentor/students"
          className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
        >
          Back to students
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-neutral-900">
          {student.studentName}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Mentor view for attendance, planning, and issue tracking.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-neutral-200 bg-white p-2 shadow-sm">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`min-h-11 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-neutral-900 text-white"
                : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {content}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
