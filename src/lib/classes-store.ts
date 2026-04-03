import {
  getStudentIdsForClass,
  setClassStudentIds,
  removeAllLinksForClass,
  listClassStudentLinks,
  replaceAllClassStudentLinks,
} from "@/lib/class-students-store";

export const CLASSES_STORAGE_KEY = "motiva-admin-classes";

export type ClassDuration = 12 | 25;

/** Persisted row (no student list). */
export type StoredClass = {
  id: string;
  name: string;
  teacherId: string;
  duration: ClassDuration;
  unlockedDay: number;
  completedDays: number;
};

/** With roster joined for UI. */
export type ClassRecord = StoredClass & { studentIds: string[] };

function readStoredClassesLoose(): unknown[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CLASSES_STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function notifyClassesUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("motiva-classes-updated"));
}

function saveStoredClasses(classes: StoredClass[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLASSES_STORAGE_KEY, JSON.stringify(classes));
  notifyClassesUpdated();
}

function coerceDuration(row: Record<string, unknown>): ClassDuration {
  const d = row.duration ?? row.durationDays;
  return d === 25 ? 25 : 12;
}

function normalizeStored(row: Record<string, unknown>): StoredClass | null {
  if (
    typeof row.id !== "string" ||
    typeof row.name !== "string" ||
    typeof row.teacherId !== "string"
  ) {
    return null;
  }
  const duration = coerceDuration(row);
  let unlockedDay =
    typeof row.unlockedDay === "number" && !Number.isNaN(row.unlockedDay)
      ? row.unlockedDay
      : 1;
  let completedDays =
    typeof row.completedDays === "number" && !Number.isNaN(row.completedDays)
      ? row.completedDays
      : 0;

  unlockedDay = Math.max(1, Math.min(unlockedDay, duration));
  completedDays = Math.max(0, Math.min(completedDays, duration));
  if (completedDays > unlockedDay) {
    completedDays = unlockedDay;
  }

  return {
    id: row.id,
    name: row.name,
    teacherId: row.teacherId,
    duration,
    unlockedDay,
    completedDays,
  };
}

function migrateLegacyShapeIfNeeded(rows: unknown[]): StoredClass[] {
  const existingLinks = listClassStudentLinks();
  const hadLegacyKeys = rows.some((item) => {
    if (!item || typeof item !== "object") return false;
    const o = item as Record<string, unknown>;
    return "studentIds" in o || "durationDays" in o;
  });

  const roster: { classId: string; studentId: string }[] = [];
  const out: StoredClass[] = [];

  for (const item of rows) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const legacyIds = Array.isArray(o.studentIds)
      ? o.studentIds.filter((id): id is string => typeof id === "string")
      : null;

    const base = normalizeStored(o);
    if (!base) continue;

    out.push(base);

    if (existingLinks.length === 0 && legacyIds && legacyIds.length > 0) {
      for (const studentId of legacyIds) {
        roster.push({ classId: base.id, studentId });
      }
    }
  }

  let needsSave = hadLegacyKeys;
  if (existingLinks.length === 0 && roster.length > 0) {
    replaceAllClassStudentLinks(roster);
    needsSave = true;
  }
  if (needsSave) {
    saveStoredClasses(out);
  }

  return out;
}

function listStoredClasses(): StoredClass[] {
  const raw = readStoredClassesLoose();
  if (raw.length === 0) return [];
  return migrateLegacyShapeIfNeeded(raw);
}

export function listClasses(): ClassRecord[] {
  return listStoredClasses().map((c) => ({
    ...c,
    studentIds: getStudentIdsForClass(c.id),
  }));
}

export function getClassById(id: string): ClassRecord | null {
  return listClasses().find((c) => c.id === id) ?? null;
}

export { setClassStudentIds };

function batchLabelForTeacher(teacherId: string, existing: StoredClass[]): string {
  const n = existing.filter((c) => c.teacherId === teacherId).length;
  if (n < 26) return String.fromCharCode(65 + n);
  return String(n + 1);
}

export function addClass(
  teacherId: string,
  duration: ClassDuration,
): ClassRecord {
  const existing = listStoredClasses();
  const letter = batchLabelForTeacher(teacherId, existing);
  const name = `Batch ${letter} - ${duration} Days`;
  const record: StoredClass = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    teacherId,
    duration,
    unlockedDay: 1,
    completedDays: 0,
  };
  saveStoredClasses([...existing, record]);
  return { ...record, studentIds: [] };
}

export function deleteClass(id: string) {
  removeAllLinksForClass(id);
  const next = listStoredClasses().filter((c) => c.id !== id);
  saveStoredClasses(next);
}

/**
 * Mark the next day complete within the currently unlocked range.
 * Does not unlock further days — use `unlockNextClassDay` for that.
 */
export function markDayComplete(classId: string) {
  const classes = listStoredClasses();
  const idx = classes.findIndex((c) => c.id === classId);
  if (idx === -1) return;
  const c = classes[idx];
  if (c.completedDays >= c.unlockedDay) return;
  if (c.completedDays >= c.duration) return;

  const next = [...classes];
  next[idx] = {
    ...c,
    completedDays: c.completedDays + 1,
  };
  saveStoredClasses(next);
}

/** Unlock the next day after all currently unlocked days are marked complete. */
export function unlockNextClassDay(classId: string) {
  const classes = listStoredClasses();
  const idx = classes.findIndex((c) => c.id === classId);
  if (idx === -1) return;
  const c = classes[idx];
  if (c.unlockedDay >= c.duration) return;
  if (c.completedDays < c.unlockedDay) return;

  const next = [...classes];
  next[idx] = {
    ...c,
    unlockedDay: Math.min(c.unlockedDay + 1, c.duration),
  };
  saveStoredClasses(next);
}
