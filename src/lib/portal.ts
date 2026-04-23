export function formatShortDate(value: Date | string | null | undefined): string {
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
  }).format(date);
}

export function formatShortDateTime(value: Date | string | null | undefined): string {
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
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatPercentage(value: number): string {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export function calculatePercentage(presentCount: number, absentCount: number): number {
  const total = presentCount + absentCount;
  if (!total) {
    return 0;
  }

  return (presentCount / total) * 100;
}

export function getAttendanceSquareClass(status: "present" | "absent" | "empty") {
  if (status === "present") {
    return "bg-emerald-500";
  }
  if (status === "absent") {
    return "bg-rose-500";
  }
  return "bg-neutral-300";
}

export function getMoodEmoji(rating: number | null | undefined): string {
  switch (rating) {
    case 1:
      return "😞";
    case 2:
      return "😕";
    case 3:
      return "😐";
    case 4:
      return "🙂";
    case 5:
      return "😄";
    default:
      return "—";
  }
}

export function todayDateOnly(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

export function moodLabel(rating: number): string {
  switch (rating) {
    case 1:
      return "Very low";
    case 2:
      return "Low";
    case 3:
      return "Neutral";
    case 4:
      return "Good";
    case 5:
      return "Great";
    default:
      return "Unknown";
  }
}
