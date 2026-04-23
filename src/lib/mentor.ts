export type LearningPlanSubject = {
  subjectName: string;
  dailyTargetMinutes: number;
  notes: string;
};

export type IssueTimelineEntry = {
  text: string;
  timestamp: string;
  addedBy: string;
  status?: string;
};

export function calculateAttendancePercentage(
  presentCount: number,
  absentCount: number,
): number {
  const total = presentCount + absentCount;
  if (total <= 0) {
    return 0;
  }

  return Math.round((presentCount / total) * 100);
}

export function getAttendanceTone(attendancePercentage: number): string {
  if (attendancePercentage >= 80) {
    return "text-emerald-700";
  }
  if (attendancePercentage >= 60) {
    return "text-amber-700";
  }
  return "text-rose-700";
}

export function getIssueStatusClasses(status: string): string {
  switch (status) {
    case "resolved":
      return "bg-emerald-100 text-emerald-700 ring-emerald-200";
    case "in_progress":
      return "bg-amber-100 text-amber-700 ring-amber-200";
    default:
      return "bg-rose-100 text-rose-700 ring-rose-200";
  }
}

export function getPriorityClasses(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-rose-100 text-rose-700 ring-rose-200";
    case "medium":
      return "bg-amber-100 text-amber-700 ring-amber-200";
    default:
      return "bg-sky-100 text-sky-700 ring-sky-200";
  }
}

export function getCategoryClasses(category: string): string {
  switch (category) {
    case "attendance":
      return "bg-amber-100 text-amber-700 ring-amber-200";
    case "behavioral":
      return "bg-fuchsia-100 text-fuchsia-700 ring-fuchsia-200";
    case "emotional":
      return "bg-rose-100 text-rose-700 ring-rose-200";
    case "academic":
      return "bg-sky-100 text-sky-700 ring-sky-200";
    default:
      return "bg-neutral-100 text-neutral-700 ring-neutral-200";
  }
}

export function humanizeSnakeCase(value: string | null | undefined): string {
  if (!value) {
    return "Not set";
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "Not set";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function parseLearningPlanSubjects(
  value: unknown,
): LearningPlanSubject[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((subject) => {
      if (!subject || typeof subject !== "object") {
        return null;
      }

      const record = subject as Record<string, unknown>;
      const subjectName =
        typeof record.subjectName === "string" ? record.subjectName.trim() : "";
      const dailyTargetMinutes =
        typeof record.dailyTargetMinutes === "number"
          ? record.dailyTargetMinutes
          : typeof record.dailyTargetMinutes === "string"
            ? Number(record.dailyTargetMinutes)
            : 0;
      const notes = typeof record.notes === "string" ? record.notes : "";

      if (!subjectName) {
        return null;
      }

      return {
        subjectName,
        dailyTargetMinutes: Number.isFinite(dailyTargetMinutes)
          ? dailyTargetMinutes
          : 0,
        notes,
      };
    })
    .filter((subject): subject is LearningPlanSubject => subject !== null);
}

export function parseIssueTimeline(value: unknown): IssueTimelineEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries = value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as Record<string, unknown>;
      if (
        typeof record.text !== "string" ||
        typeof record.timestamp !== "string" ||
        typeof record.addedBy !== "string"
      ) {
        return null;
      }

      const parsedEntry: IssueTimelineEntry = {
        text: record.text,
        timestamp: record.timestamp,
        addedBy: record.addedBy,
      };

      if (typeof record.status === "string") {
        parsedEntry.status = record.status;
      }

      return parsedEntry;
    })
    .filter((entry): entry is IssueTimelineEntry => entry !== null);

  return entries;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function startOfWeek(date: Date): Date {
  const start = startOfDay(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
