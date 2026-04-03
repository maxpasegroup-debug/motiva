export const ATTENDANCE_STORAGE_KEY = "motiva-attendance";

/** Outer key: `${classId}|${yyyy-mm-dd}` → studentId → present */
export type AttendanceStoreShape = Record<string, Record<string, boolean>>;

export function attendanceStoreKey(classId: string, dateYmd: string) {
  return `${classId}|${dateYmd}`;
}

export function todayYmdLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readAll(): AttendanceStoreShape {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(ATTENDANCE_STORAGE_KEY);
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return {};
    return data as AttendanceStoreShape;
  } catch {
    return {};
  }
}

function writeAll(map: AttendanceStoreShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(map));
}

export function getDayAttendance(
  classId: string,
  dateYmd: string,
): Record<string, boolean> {
  const all = readAll();
  const k = attendanceStoreKey(classId, dateYmd);
  const inner = all[k];
  if (!inner || typeof inner !== "object") return {};
  return { ...inner };
}

export function setStudentPresent(
  classId: string,
  dateYmd: string,
  studentId: string,
  present: boolean,
) {
  const all = readAll();
  const k = attendanceStoreKey(classId, dateYmd);
  const prev = all[k] && typeof all[k] === "object" ? { ...all[k] } : {};
  if (present) prev[studentId] = true;
  else delete prev[studentId];
  all[k] = prev;
  writeAll(all);
}

export function toggleStudentPresent(
  classId: string,
  dateYmd: string,
  studentId: string,
): boolean {
  const cur = getDayAttendance(classId, dateYmd)[studentId] === true;
  const next = !cur;
  setStudentPresent(classId, dateYmd, studentId, next);
  return next;
}
