export const STUDENT_PAYMENTS_STORAGE_KEY = "motiva-student-payments";

export type PaymentStatus = "paid" | "pending";

function isPaymentStatus(x: unknown): x is PaymentStatus {
  return x === "paid" || x === "pending";
}

type PaymentsShape = Record<string, PaymentStatus>;

function readAll(): PaymentsShape {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STUDENT_PAYMENTS_STORAGE_KEY);
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return {};
    const o = data as Record<string, unknown>;
    const out: PaymentsShape = {};
    for (const [k, v] of Object.entries(o)) {
      if (typeof k === "string" && isPaymentStatus(v)) out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

function writeAll(map: PaymentsShape) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STUDENT_PAYMENTS_STORAGE_KEY,
    JSON.stringify(map),
  );
}

function notifyPaymentsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("motiva-student-payments-updated"));
}

export function getStudentPaymentStatus(studentId: string): PaymentStatus {
  const map = readAll();
  return map[studentId] ?? "pending";
}

export function setStudentPaymentStatus(
  studentId: string,
  status: PaymentStatus,
) {
  const map = readAll();
  map[studentId] = status;
  writeAll(map);
  notifyPaymentsUpdated();
}

export function deleteStudentPaymentStatus(studentId: string) {
  const map = readAll();
  delete map[studentId];
  writeAll(map);
  notifyPaymentsUpdated();
}

