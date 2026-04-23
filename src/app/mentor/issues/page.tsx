import Link from "next/link";
import { getCategoryClasses, getIssueStatusClasses, getPriorityClasses, humanizeSnakeCase, formatDate } from "@/lib/mentor";
import { requireMentorSession } from "@/server/mentor/auth";
import { getMentorIssues } from "@/server/mentor/data";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

export default async function MentorIssuesPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const session = requireMentorSession();
  const activeStatus = FILTERS.some((filter) => filter.key === searchParams?.status)
    ? (searchParams?.status as string)
    : "all";
  const issues = await getMentorIssues(session.userId, activeStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Issue Tracker</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Review, raise, and resolve issues across your student portfolio.
          </p>
        </div>
        <Link
          href="/mentor/issues/new"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Raise New Issue
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-neutral-200 bg-white p-2 shadow-sm">
        {FILTERS.map((filter) => (
          <Link
            key={filter.key}
            href={filter.key === "all" ? "/mentor/issues" : `/mentor/issues?status=${filter.key}`}
            className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold ${
              activeStatus === filter.key
                ? "bg-neutral-900 text-white"
                : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-5 py-3 font-medium">Student Name</th>
              <th className="px-5 py-3 font-medium">Issue Title</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Priority</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.length > 0 ? (
              issues.map((issue) => (
                <tr key={issue.id} className="border-t border-neutral-100">
                  <td className="px-5 py-4 font-medium text-neutral-900">
                    {issue.student?.studentName ?? "Student not linked"}
                  </td>
                  <td className="px-5 py-4 text-neutral-700">{issue.title}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getCategoryClasses(issue.category ?? "other")}`}>
                      {humanizeSnakeCase(issue.category ?? "other")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getPriorityClasses(issue.priority)}`}>
                      {humanizeSnakeCase(issue.priority)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getIssueStatusClasses(issue.status)}`}>
                      {humanizeSnakeCase(issue.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{formatDate(issue.createdAt)}</td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/mentor/issues/${issue.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-neutral-500">
                  No issues found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
