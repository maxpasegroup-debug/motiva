"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getAttendanceTone } from "@/lib/mentor";

type MetricCard = {
  totalStudents: number;
  classesToday: number;
  pendingIssues: number;
  atRiskStudents: number;
};

type StudentRow = {
  id: string;
  studentName: string;
  programType: string;
  currentDay: number | null;
  attendancePercentage: number;
  lastActive: string;
};

type ClassRow = {
  id: string;
  time: string;
  studentName: string;
  teacherName: string;
  subject: string;
};

type Props = {
  heading: string;
  subheading: string;
  metrics: MetricCard;
  students: StudentRow[];
  classes: ClassRow[];
  hideClasses?: boolean;
};

export function MentorDashboardView({
  heading,
  subheading,
  metrics,
  students,
  classes,
  hideClasses = false,
}: Props) {
  const [query, setQuery] = useState("");

  const filteredStudents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return students;
    }

    return students.filter((student) =>
      student.studentName.toLowerCase().includes(normalized),
    );
  }, [query, students]);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Mentor Portal</p>
            <h1 className="mt-2 text-2xl font-bold text-neutral-900 sm:text-3xl">{heading}</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600">{subheading}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/mentor/admissions/new"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Create Admission
            </Link>
            <Link
              href="/mentor/students"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              Allocate Batch
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricBox label="Total Students" value={metrics.totalStudents} />
        <MetricBox label="Classes Today" value={metrics.classesToday} />
        <MetricBox label="Pending Issues" value={metrics.pendingIssues} />
        <MetricBox label="At-Risk Students" value={metrics.atRiskStudents} />
      </section>

      <section
        className={`grid gap-6 ${
          hideClasses ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-[1.7fr_1fr]"
        }`}
      >
        <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">My Students</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Search and open student profiles for attendance, plans, and issues.
                </p>
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by student name"
                className="min-h-11 w-full rounded-2xl border border-neutral-200 px-4 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-400 sm:max-w-xs"
              />
            </div>
          </div>
          <div className="grid gap-3 p-4 md:hidden">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <Link
                  key={student.id}
                  href={`/mentor/students/${student.id}`}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900">{student.studentName}</p>
                      <p className="mt-1 text-xs text-neutral-500">{student.lastActive}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {student.programType}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-neutral-500">Current Day</p>
                      <p className="mt-1 font-semibold text-neutral-900">
                        {student.currentDay ? `Day ${student.currentDay}` : "Not assigned"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs text-neutral-500">Attendance</p>
                      <p className={`mt-1 font-semibold ${getAttendanceTone(student.attendancePercentage)}`}>
                        {student.attendancePercentage}%
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                No students match your search.
              </div>
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Student Name</th>
                  <th className="px-5 py-3 font-medium">Program Type</th>
                  <th className="px-5 py-3 font-medium">Current Day</th>
                  <th className="px-5 py-3 font-medium">Attendance %</th>
                  <th className="px-5 py-3 font-medium">Last Active</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-t border-neutral-100">
                      <td className="px-5 py-4 font-medium text-neutral-900">
                        {student.studentName}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-200">
                          {student.programType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {student.currentDay ? `Day ${student.currentDay}` : "Not assigned"}
                      </td>
                      <td
                        className={`px-5 py-4 font-semibold ${getAttendanceTone(
                          student.attendancePercentage,
                        )}`}
                      >
                        {student.attendancePercentage}%
                      </td>
                      <td className="px-5 py-4 text-neutral-600">{student.lastActive}</td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/mentor/students/${student.id}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">
                      No students match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!hideClasses ? (
          <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-neutral-900">Today&apos;s Classes</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Scheduled sessions for your students today.
              </p>
            </div>
            <div className="space-y-3 p-5">
              {classes.length > 0 ? (
                classes.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-neutral-900">
                        {schedule.time}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-200">
                        {schedule.subject}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-neutral-900">
                      {schedule.studentName}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Teacher: {schedule.teacherName}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
                  No classes today.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-neutral-900 sm:text-3xl">{value}</p>
    </div>
  );
}
