export const ADMISSIONS_STORAGE_KEY = "motiva-admissions";

export type AdmissionStatus = "pending" | "approved" | "rejected";

export type AdmissionRequest = {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  courseInterest: string;
  programId?: string;
  notes?: string;
  status: AdmissionStatus;
  createdAt: string;
};

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("motiva-admissions-updated"));
}

function readAll(): AdmissionRequest[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ADMISSIONS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (x): x is AdmissionRequest =>
        !!x &&
        typeof x === "object" &&
        typeof (x as AdmissionRequest).id === "string" &&
        typeof (x as AdmissionRequest).studentName === "string" &&
        typeof (x as AdmissionRequest).parentName === "string" &&
        typeof (x as AdmissionRequest).phone === "string" &&
        typeof (x as AdmissionRequest).courseInterest === "string" &&
        ((x as AdmissionRequest).status === "pending" ||
          (x as AdmissionRequest).status === "approved" ||
          (x as AdmissionRequest).status === "rejected") &&
        ((x as AdmissionRequest).programId === undefined ||
          typeof (x as AdmissionRequest).programId === "string") &&
        ((x as AdmissionRequest).notes === undefined ||
          typeof (x as AdmissionRequest).notes === "string"),
    );
  } catch {
    return [];
  }
}

function writeAll(rows: AdmissionRequest[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(rows));
  notify();
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `adm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function listAdmissions(): AdmissionRequest[] {
  return readAll();
}

export function listPendingAdmissions(): AdmissionRequest[] {
  return readAll().filter((a) => a.status === "pending");
}

export function countPendingAdmissions(): number {
  return listPendingAdmissions().length;
}

export function addAdmissionRequest(input: {
  studentName: string;
  parentName: string;
  phone: string;
  courseInterest: string;
  programId?: string;
  notes?: string;
}): AdmissionRequest {
  const notes = input.notes?.trim();
  const row: AdmissionRequest = {
    id: newId(),
    studentName: input.studentName.trim(),
    parentName: input.parentName.trim(),
    phone: input.phone.trim(),
    courseInterest: input.courseInterest.trim(),
    ...(input.programId?.trim()
      ? { programId: input.programId.trim() }
      : {}),
    ...(notes ? { notes } : {}),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  writeAll([...readAll(), row]);
  return row;
}

export function setAdmissionStatus(id: string, status: AdmissionStatus) {
  const next = readAll().map((a) => (a.id === id ? { ...a, status } : a));
  writeAll(next);
}

export function deleteAdmission(id: string) {
  writeAll(readAll().filter((a) => a.id !== id));
}
