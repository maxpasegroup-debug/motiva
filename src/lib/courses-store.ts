const COURSES_KEY = "motiva-courses";
const LESSONS_KEY = "motiva-lessons";
const LEGACY_COURSES_KEY = "motiva-admin-courses";

/** Schema: Courses — id, name (+ unlock state for this app). */
export type CourseEntity = {
  id: string;
  name: string;
  /** 1-based: lessons 1..unlockedThroughLesson are open. */
  unlockedThroughLesson: number;
  description?: string;
  thumbnailUrl?: string;
};

/** Schema: Lessons — id, course_id, title, video_url */
export type LessonEntity = {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
};

/** UI bundle (lessons embedded). */
export type LessonRecord = {
  id: string;
  title: string;
  videoUrl: string;
};

export type CourseRecord = {
  id: string;
  name: string;
  lessons: LessonRecord[];
  unlockedThroughLesson: number;
  description?: string;
  thumbnailUrl?: string;
};

function readCourses(): CourseEntity[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(COURSES_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (x): x is CourseEntity =>
        !!x &&
        typeof x === "object" &&
        typeof (x as CourseEntity).id === "string" &&
        typeof (x as CourseEntity).name === "string" &&
        typeof (x as CourseEntity).unlockedThroughLesson === "number" &&
        ((x as CourseEntity).description === undefined ||
          typeof (x as CourseEntity).description === "string") &&
        ((x as CourseEntity).thumbnailUrl === undefined ||
          typeof (x as CourseEntity).thumbnailUrl === "string"),
    );
  } catch {
    return [];
  }
}

function saveCoursesEntities(courses: CourseEntity[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

function readLessons(): LessonEntity[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LESSONS_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (x): x is LessonEntity =>
        !!x &&
        typeof x === "object" &&
        typeof (x as LessonEntity).id === "string" &&
        typeof (x as LessonEntity).courseId === "string" &&
        typeof (x as LessonEntity).title === "string" &&
        typeof (x as LessonEntity).videoUrl === "string",
    );
  } catch {
    return [];
  }
}

function saveLessonsEntities(lessons: LessonEntity[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
}

type LegacyLesson = { id: string; title: string; videoUrl: string };
type LegacyCourse = {
  id: string;
  name: string;
  lessons: LegacyLesson[];
  unlockedThroughLesson: number;
  description?: string;
  thumbnailUrl?: string;
};

function migrateFromLegacyIfNeeded() {
  if (typeof window === "undefined") return;
  if (readCourses().length > 0 || readLessons().length > 0) return;

  const raw = window.localStorage.getItem(LEGACY_COURSES_KEY);
  if (!raw) return;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }
  if (!Array.isArray(data)) return;

  const courses: CourseEntity[] = [];
  const lessons: LessonEntity[] = [];

  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const c = item as LegacyCourse;
    if (
      typeof c.id !== "string" ||
      typeof c.name !== "string" ||
      !Array.isArray(c.lessons)
    ) {
      continue;
    }
    let u =
      typeof c.unlockedThroughLesson === "number" &&
      !Number.isNaN(c.unlockedThroughLesson)
        ? c.unlockedThroughLesson
        : 0;
    const lessonRows = c.lessons.filter(
      (l): l is LegacyLesson =>
        !!l &&
        typeof l === "object" &&
        typeof l.id === "string" &&
        typeof l.title === "string" &&
        typeof l.videoUrl === "string",
    );
    u = Math.max(0, Math.min(u, lessonRows.length));
    if (lessonRows.length > 0 && u === 0) u = 1;

    courses.push({
      id: c.id,
      name: c.name,
      unlockedThroughLesson: u,
      ...(typeof c.description === "string" && c.description.trim()
        ? { description: c.description.trim() }
        : {}),
      ...(typeof c.thumbnailUrl === "string" && c.thumbnailUrl.trim()
        ? { thumbnailUrl: c.thumbnailUrl.trim() }
        : {}),
    });

    for (const l of lessonRows) {
      lessons.push({
        id: l.id,
        courseId: c.id,
        title: l.title,
        videoUrl: l.videoUrl,
      });
    }
  }

  if (courses.length > 0) {
    saveCoursesEntities(courses);
    saveLessonsEntities(lessons);
  }
}

function bundleCourse(c: CourseEntity): CourseRecord {
  migrateFromLegacyIfNeeded();
  const lessons = readLessons()
    .filter((l) => l.courseId === c.id)
    .map((l) => ({
      id: l.id,
      title: l.title,
      videoUrl: l.videoUrl,
    }));
  let u = c.unlockedThroughLesson;
  u = Math.max(0, Math.min(u, lessons.length));
  if (lessons.length > 0 && u === 0) u = 1;
  return {
    id: c.id,
    name: c.name,
    lessons,
    unlockedThroughLesson: u,
    ...(c.description ? { description: c.description } : {}),
    ...(c.thumbnailUrl ? { thumbnailUrl: c.thumbnailUrl } : {}),
  };
}

export function listCourses(): CourseRecord[] {
  migrateFromLegacyIfNeeded();
  return readCourses().map(bundleCourse);
}

export function getCourseById(id: string): CourseRecord | null {
  migrateFromLegacyIfNeeded();
  const c = readCourses().find((x) => x.id === id);
  return c ? bundleCourse(c) : null;
}

function newId(prefix: string) {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function addCourse(
  name: string,
  meta?: { description?: string; thumbnailUrl?: string },
): CourseRecord {
  migrateFromLegacyIfNeeded();
  const trimmed = name.trim();
  const desc = meta?.description?.trim();
  const thumb = meta?.thumbnailUrl?.trim();
  const record: CourseEntity = {
    id: newId("co"),
    name: trimmed,
    unlockedThroughLesson: 0,
    ...(desc ? { description: desc } : {}),
    ...(thumb ? { thumbnailUrl: thumb } : {}),
  };
  saveCoursesEntities([...readCourses(), record]);
  return bundleCourse(record);
}

export function addLesson(
  courseId: string,
  title: string,
  videoUrl: string,
): boolean {
  migrateFromLegacyIfNeeded();
  const courses = readCourses();
  const idx = courses.findIndex((c) => c.id === courseId);
  if (idx === -1) return false;
  const c = courses[idx];
  const lesson: LessonEntity = {
    id: newId("ls"),
    courseId,
    title: title.trim(),
    videoUrl: videoUrl.trim(),
  };
  const nextLessons = [...readLessons(), lesson];
  saveLessonsEntities(nextLessons);

  let unlocked = c.unlockedThroughLesson;
  if (nextLessons.filter((l) => l.courseId === courseId).length === 1) {
    unlocked = 1;
  } else if (unlocked === 0) {
    unlocked = 1;
  }
  const count = nextLessons.filter((l) => l.courseId === courseId).length;
  const nextCourses = [...courses];
  nextCourses[idx] = {
    ...c,
    unlockedThroughLesson: Math.min(unlocked, count),
  };
  saveCoursesEntities(nextCourses);
  return true;
}

export function unlockNextLesson(courseId: string) {
  migrateFromLegacyIfNeeded();
  const courses = readCourses();
  const idx = courses.findIndex((c) => c.id === courseId);
  if (idx === -1) return;
  const c = courses[idx];
  const n = readLessons().filter((l) => l.courseId === courseId).length;
  if (c.unlockedThroughLesson >= n) return;
  const next = [...courses];
  next[idx] = {
    ...c,
    unlockedThroughLesson: c.unlockedThroughLesson + 1,
  };
  saveCoursesEntities(next);
}

export function deleteCourse(courseId: string) {
  migrateFromLegacyIfNeeded();
  saveCoursesEntities(readCourses().filter((c) => c.id !== courseId));
  saveLessonsEntities(
    readLessons().filter((l) => l.courseId !== courseId),
  );
}
