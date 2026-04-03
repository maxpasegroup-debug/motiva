import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const PROGRAMS_FILE = path.join(DATA_DIR, "programs.json");

/** Persisted program (landing + admin). */
export type Program = {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  image_url: string;
  description: string;
  is_active: boolean;
};

export type ProgramPublic = Omit<Program, "is_active">;

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

function isProgram(x: unknown): x is Program {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.title === "string" &&
    typeof o.subtitle === "string" &&
    typeof o.duration === "number" &&
    (o.duration === 12 || o.duration === 25) &&
    typeof o.image_url === "string" &&
    typeof o.description === "string" &&
    typeof o.is_active === "boolean"
  );
}

export async function readPrograms(): Promise<Program[]> {
  await ensureDataFile();
  const raw = await fs.readFile(PROGRAMS_FILE, "utf-8");
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isProgram);
  } catch {
    return [];
  }
}

async function writePrograms(programs: Program[]) {
  await ensureDataFile();
  await fs.writeFile(PROGRAMS_FILE, JSON.stringify(programs, null, 2), "utf-8");
}

export async function listActivePrograms(): Promise<ProgramPublic[]> {
  const rows = await readPrograms();
  return rows
    .filter((p) => p.is_active)
    .map(({ id, title, subtitle, duration, image_url, description }) => ({
      id,
      title,
      subtitle,
      duration,
      image_url,
      description,
    }));
}

export async function getProgramById(id: string): Promise<Program | null> {
  return (await readPrograms()).find((p) => p.id === id) ?? null;
}

export async function createProgram(input: {
  title: string;
  subtitle: string;
  duration: number;
  image_url: string;
  description: string;
  is_active: boolean;
}): Promise<Program> {
  const rows = await readPrograms();
  const row: Program = {
    id: newId(),
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    duration: input.duration === 25 ? 25 : 12,
    image_url: input.image_url.trim(),
    description: input.description.trim(),
    is_active: input.is_active,
  };
  rows.push(row);
  await writePrograms(rows);
  return row;
}

export async function updateProgram(
  id: string,
  patch: Partial<
    Pick<
      Program,
      | "title"
      | "subtitle"
      | "duration"
      | "image_url"
      | "description"
      | "is_active"
    >
  >,
): Promise<Program | null> {
  const rows = await readPrograms();
  const idx = rows.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const cur = rows[idx];
  const next: Program = {
    ...cur,
    ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
    ...(patch.subtitle !== undefined ? { subtitle: patch.subtitle.trim() } : {}),
    ...(patch.duration !== undefined
      ? { duration: patch.duration === 25 ? 25 : 12 }
      : {}),
    ...(patch.image_url !== undefined
      ? { image_url: patch.image_url.trim() }
      : {}),
    ...(patch.description !== undefined
      ? { description: patch.description.trim() }
      : {}),
    ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
  };
  rows[idx] = next;
  await writePrograms(rows);
  return next;
}

export async function deleteProgram(id: string): Promise<boolean> {
  const rows = await readPrograms();
  const next = rows.filter((p) => p.id !== id);
  if (next.length === rows.length) return false;
  await writePrograms(next);
  return true;
}
