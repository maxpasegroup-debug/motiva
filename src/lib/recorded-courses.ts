export const COURSE_TARGET_ROLES = [
  "public",
  "student",
  "parent",
  "teacher",
  "mentor",
  "all",
] as const;

export type CourseTargetRole = (typeof COURSE_TARGET_ROLES)[number];

export const COURSE_STATUSES = ["draft", "published"] as const;
export const SECTION_TYPES = ["intro", "lesson"] as const;

export function isTargetRole(
  s: string,
): s is CourseTargetRole {
  return (COURSE_TARGET_ROLES as readonly string[]).includes(s);
}
