export const COURSE_TARGET_ROLES = [
  "public",
  "student",
  "parent",
  "teacher",
  "mentor",
  "all",
] as const;

export type CourseTargetRole = (typeof COURSE_TARGET_ROLES)[number];
export type CourseAudienceRole = Exclude<CourseTargetRole, "all">;

export const COURSE_STATUSES = ["draft", "published"] as const;
export const SECTION_TYPES = ["intro", "lesson"] as const;

export function isTargetRole(
  s: string,
): s is CourseTargetRole {
  return (COURSE_TARGET_ROLES as readonly string[]).includes(s);
}

export function parseCourseAudience(value: string | null | undefined): CourseAudienceRole[] {
  if (!value?.trim()) return ["public"];
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.includes("all")) {
    return ["public", "student", "parent", "teacher", "mentor"];
  }

  const valid = parts.filter(
    (part): part is CourseAudienceRole =>
      isTargetRole(part) && part !== "all",
  );

  const fallback: CourseAudienceRole[] = ["public"];
  return Array.from(new Set(valid.length > 0 ? valid : fallback));
}

export function serializeCourseAudience(value: unknown): string {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const valid = raw
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(
      (part): part is CourseAudienceRole =>
        isTargetRole(part) && part !== "all",
    );
  const unique = Array.from(new Set(valid));
  return (unique.length > 0 ? unique : ["public"]).join(",");
}

export function courseIsVisibleToAudience(
  targetRole: string | null | undefined,
  role: CourseAudienceRole | "all",
): boolean {
  const audience = parseCourseAudience(targetRole);
  return role === "all" || audience.includes(role);
}

export function formatCourseAudience(targetRole: string | null | undefined): string {
  return parseCourseAudience(targetRole)
    .map((role) => role.replace(/_/g, " "))
    .join(", ");
}
