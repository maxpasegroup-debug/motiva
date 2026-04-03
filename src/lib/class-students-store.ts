export const CLASS_STUDENTS_STORAGE_KEY = "motiva-class-students";

/** Schema: ClassStudents — class_id, student_id */
export type ClassStudentRecord = {
  classId: string;
  studentId: string;
};

function isLink(x: unknown): x is ClassStudentRecord {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.classId === "string" && typeof o.studentId === "string";
}

function readLinks(): ClassStudentRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CLASS_STUDENTS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isLink);
  } catch {
    return [];
  }
}

function writeLinks(links: ClassStudentRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CLASS_STUDENTS_STORAGE_KEY,
    JSON.stringify(links),
  );
}

/** Replace entire junction table (e.g. one-time migration). */
export function replaceAllClassStudentLinks(links: ClassStudentRecord[]) {
  writeLinks(links);
}

export function listClassStudentLinks(): ClassStudentRecord[] {
  return readLinks();
}

export function getStudentIdsForClass(classId: string): string[] {
  const ids = new Set<string>();
  for (const row of readLinks()) {
    if (row.classId === classId) ids.add(row.studentId);
  }
  return Array.from(ids);
}

/** Replace roster for classId; removes these students from every other class. */
export function setClassStudentIds(classId: string, nextIds: string[]) {
  const idSet = new Set(nextIds);
  const rest = listClassStudentLinks().filter(
    (l) => l.classId !== classId && !idSet.has(l.studentId),
  );
  const next: ClassStudentRecord[] = [
    ...rest,
    ...nextIds.map((studentId) => ({ classId, studentId })),
  ];
  writeLinks(next);
}

/** Remove any links mentioning student (e.g. after student delete). */
export function removeStudentFromAllClasses(studentId: string) {
  writeLinks(
    listClassStudentLinks().filter((l) => l.studentId !== studentId),
  );
}

/** Remove all links for class (e.g. after class delete). */
export function removeAllLinksForClass(classId: string) {
  writeLinks(
    listClassStudentLinks().filter((l) => l.classId !== classId),
  );
}
