/** Extra admin data per student (parent contact, course label, link to parent user). */

export const STUDENT_PROFILES_KEY = "motiva-student-profiles";

export type StudentAdminProfile = {
  studentId: string;
  parentName: string;
  parentPhone: string;
  parentUserId?: string;
  courseId?: string;
  courseLabel?: string;
};

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("motiva-student-profiles-updated"));
}

function readMap(): Record<string, StudentAdminProfile> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STUDENT_PROFILES_KEY);
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return {};
    const o = data as Record<string, unknown>;
    const out: Record<string, StudentAdminProfile> = {};
    for (const [k, v] of Object.entries(o)) {
      if (!v || typeof v !== "object") continue;
      const p = v as Record<string, unknown>;
      if (typeof p.studentId !== "string") continue;
      out[k] = {
        studentId: p.studentId,
        parentName:
          typeof p.parentName === "string" ? p.parentName : "",
        parentPhone:
          typeof p.parentPhone === "string" ? p.parentPhone : "",
        parentUserId:
          typeof p.parentUserId === "string" ? p.parentUserId : undefined,
        courseId: typeof p.courseId === "string" ? p.courseId : undefined,
        courseLabel:
          typeof p.courseLabel === "string" ? p.courseLabel : undefined,
      };
    }
    return out;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, StudentAdminProfile>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STUDENT_PROFILES_KEY, JSON.stringify(map));
  notify();
}

export function getStudentProfile(
  studentId: string,
): StudentAdminProfile | null {
  return readMap()[studentId] ?? null;
}

export function upsertStudentProfile(profile: StudentAdminProfile) {
  const map = readMap();
  map[profile.studentId] = profile;
  writeMap(map);
}

export function deleteStudentProfile(studentId: string) {
  const map = readMap();
  delete map[studentId];
  writeMap(map);
}

export function listStudentProfiles(): StudentAdminProfile[] {
  return Object.values(readMap());
}

export function listProfilesForParent(parentUserId: string): StudentAdminProfile[] {
  return listStudentProfiles().filter((p) => p.parentUserId === parentUserId);
}
