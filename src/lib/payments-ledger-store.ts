/** Payment rows for admin (amount + history). */

export const PAYMENTS_LEDGER_KEY = "motiva-payments-ledger";

export type LedgerPaymentStatus = "paid" | "pending";

export type PaymentLedgerEntry = {
  id: string;
  studentId: string;
  studentName: string;
  courseLabel: string;
  amount: number;
  status: LedgerPaymentStatus;
  createdAt: string;
};

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("motiva-payments-ledger-updated"));
}

function readAll(): PaymentLedgerEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PAYMENTS_LEDGER_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (x): x is PaymentLedgerEntry =>
        !!x &&
        typeof x === "object" &&
        typeof (x as PaymentLedgerEntry).id === "string" &&
        typeof (x as PaymentLedgerEntry).studentId === "string" &&
        typeof (x as PaymentLedgerEntry).studentName === "string" &&
        typeof (x as PaymentLedgerEntry).courseLabel === "string" &&
        typeof (x as PaymentLedgerEntry).amount === "number" &&
        ((x as PaymentLedgerEntry).status === "paid" ||
          (x as PaymentLedgerEntry).status === "pending") &&
        typeof (x as PaymentLedgerEntry).createdAt === "string",
    );
  } catch {
    return [];
  }
}

function writeAll(rows: PaymentLedgerEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PAYMENTS_LEDGER_KEY, JSON.stringify(rows));
  notify();
}

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `pay-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function listPaymentEntries(): PaymentLedgerEntry[] {
  return [...readAll()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function addPaymentEntry(input: {
  studentId: string;
  studentName: string;
  courseLabel: string;
  amount: number;
  status: LedgerPaymentStatus;
}): PaymentLedgerEntry {
  const row: PaymentLedgerEntry = {
    id: newId(),
    studentId: input.studentId,
    studentName: input.studentName,
    courseLabel: input.courseLabel,
    amount: Math.max(0, Math.round(input.amount * 100) / 100),
    status: input.status,
    createdAt: new Date().toISOString(),
  };
  writeAll([...readAll(), row]);
  return row;
}

export function setPaymentEntryStatus(id: string, status: LedgerPaymentStatus) {
  const next = readAll().map((p) => (p.id === id ? { ...p, status } : p));
  writeAll(next);
}

export function totalPaidAmount(): number {
  return readAll()
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
}

export function deletePaymentsForStudent(studentId: string) {
  writeAll(readAll().filter((p) => p.studentId !== studentId));
}
