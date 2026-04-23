import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { MentorIssueDetailView } from "@/components/mentor/MentorIssueDetailView";
import { formatDateTime, parseIssueTimeline } from "@/lib/mentor";
import { requireMentorSession } from "@/server/mentor/auth";
import { getMentorIssueDetail } from "@/server/mentor/data";

export const dynamic = "force-dynamic";

export default async function MentorIssueDetailPage({
  params,
}: {
  params: { issueId: string };
}) {
  const session = requireMentorSession();
  const issue = await getMentorIssueDetail(session.userId, params.issueId);

  if (!issue) {
    notFound();
  }

  const timeline = parseIssueTimeline(issue.timeline);
  const actorIds = Array.from(new Set(timeline.map((entry) => entry.addedBy)));
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: {
          id: {
            in: actorIds,
          },
        },
        select: {
          id: true,
          name: true,
          role: true,
        },
      })
    : [];
  const actorMap = new Map(
    actors.map((actor) => [actor.id, `${actor.name} (${actor.role})`]),
  );

  return (
    <MentorIssueDetailView
      issueId={issue.id}
      title={issue.title}
      studentName={issue.student?.studentName ?? "Student not linked"}
      category={issue.category ?? "other"}
      priority={issue.priority}
      status={issue.status}
      description={issue.description ?? ""}
      timeline={timeline.map((entry) => ({
        ...entry,
        displayName: actorMap.get(entry.addedBy) ?? entry.addedBy,
        timestampLabel: formatDateTime(entry.timestamp),
      }))}
    />
  );
}
