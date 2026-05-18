import fs from "fs/promises";
import path from "path";
import {
  courseIsVisibleToAudience,
  formatCourseAudience,
  serializeCourseAudience,
  type CourseAudienceRole,
} from "@/lib/recorded-courses";

const DATA_DIR = path.join(process.cwd(), "data");
const PROGRAMS_FILE = path.join(DATA_DIR, "programs.json");

/** Persisted program (landing + admin). */
export type Program = {
  id: string;
  title: string;
  description: string;
  image_path: string;
  is_active: boolean;
  audience_roles: string;
};

export type ProgramPublic = Omit<Program, "is_active"> & { audience_label: string };

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `prog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PROGRAMS_FILE);
  } catch {
    await fs.writeFile(PROGRAMS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function isStoredProgram(o: Record<string, unknown>): o is Program {
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.description === "string" &&
    typeof o.image_path === "string" &&
    typeof o.is_active === "boolean"
  );
}

/** Legacy shape (subtitle, duration, image_url). */
function migrateLegacyRow(o: Record<string, unknown>): Program | null {
  if (
    typeof o.id !== "string" ||
    typeof o.title !== "string" ||
    typeof o.is_active !== "boolean"
  ) {
    return null;
  }
  if (!("image_url" in o) && !("duration" in o)) return null;
  const description =
    typeof o.description === "string" ? o.description : "";
  const image_path =
    typeof o.image_url === "string" ? o.image_url : "";
  return {
    id: o.id,
    title: o.title,
    description,
    image_path,
    is_active: o.is_active,
    audience_roles:
      typeof o.audience_roles === "string"
        ? o.audience_roles
        : "public",
  };
}

function normalizeProgram(x: unknown): Program | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (isStoredProgram(o)) {
    return {
      ...o,
      audience_roles:
        typeof o.audience_roles === "string"
          ? serializeCourseAudience(o.audience_roles)
          : "public",
    };
  }
  return migrateLegacyRow(o);
}

export function isSafeProgramsUploadPath(p: string): boolean {
  return /^\/uploads\/programs\/[a-zA-Z0-9._-]+$/.test(p);
}

export async function unlinkProgramFile(imagePath: string): Promise<void> {
  if (!isSafeProgramsUploadPath(imagePath)) return;
  const abs = path.join(process.cwd(), "public", imagePath);
  try {
    await fs.unlink(abs);
  } catch {
    // ignore missing file
  }
}

async function writePrograms(programs: Program[]) {
  await ensureDataFile();
  await fs.writeFile(PROGRAMS_FILE, JSON.stringify(programs, null, 2), "utf-8");
}

export async function readPrograms(): Promise<Program[]> {
  await ensureDataFile();
  const raw = await fs.readFile(PROGRAMS_FILE, "utf-8");
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const programs = data
      .map(normalizeProgram)
      .filter((p): p is Program => p !== null);
    const hadLegacy = data.some((row) => {
      if (!row || typeof row !== "object") return false;
      const r = row as Record<string, unknown>;
      return (
        ("image_url" in r || "duration" in r) &&
        !("image_path" in r && typeof r.image_path === "string")
      );
    });
    if (hadLegacy) {
      await writePrograms(programs);
    }
    return programs;
  } catch {
    return [];
  }
}

export async function listActivePrograms(
  audience: CourseAudienceRole | "all" = "public",
): Promise<ProgramPublic[]> {
  const rows = await readPrograms();
  return rows
    .filter((p) => p.is_active && courseIsVisibleToAudience(p.audience_roles, audience))
    .map(({ id, title, description, image_path, audience_roles }) => ({
      id,
      title,
      description,
      image_path,
      audience_roles,
      audience_label: formatCourseAudience(audience_roles),
    }));
}

export async function getProgramById(id: string): Promise<Program | null> {
  return (await readPrograms()).find((p) => p.id === id) ?? null;
}

export async function createProgram(input: {
  title: string;
  description: string;
  image_path: string;
  is_active: boolean;
  audience_roles?: unknown;
}): Promise<Program> {
  const rows = await readPrograms();
  const row: Program = {
    id: newId(),
    title: input.title.trim(),
    description: input.description.trim(),
    image_path: input.image_path.trim(),
    is_active: input.is_active,
    audience_roles: serializeCourseAudience(input.audience_roles),
  };
  rows.push(row);
  await writePrograms(rows);
  return row;
}

export async function updateProgram(
  id: string,
  patch: Partial<Pick<Program, "title" | "description" | "image_path" | "is_active">> & {
    audience_roles?: unknown;
  },
): Promise<Program | null> {
  const rows = await readPrograms();
  const idx = rows.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const cur = rows[idx];
  const nextImage =
    patch.image_path !== undefined ? patch.image_path.trim() : cur.image_path;
  if (
    patch.image_path !== undefined &&
    nextImage !== cur.image_path &&
    isSafeProgramsUploadPath(cur.image_path)
  ) {
    await unlinkProgramFile(cur.image_path);
  }
  const next: Program = {
    ...cur,
    ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
    ...(patch.description !== undefined
      ? { description: patch.description.trim() }
      : {}),
    ...(patch.image_path !== undefined ? { image_path: nextImage } : {}),
    ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
    ...(patch.audience_roles !== undefined
      ? { audience_roles: serializeCourseAudience(patch.audience_roles) }
      : {}),
  };
  rows[idx] = next;
  await writePrograms(rows);
  return next;
}

export async function deleteProgram(id: string): Promise<boolean> {
  const rows = await readPrograms();
  const found = rows.find((p) => p.id === id);
  if (!found) return false;
  if (isSafeProgramsUploadPath(found.image_path)) {
    await unlinkProgramFile(found.image_path);
  }
  const next = rows.filter((p) => p.id !== id);
  await writePrograms(next);
  return true;
}
