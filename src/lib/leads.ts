export const LEAD_FLOW_TYPES = ["tuition", "remedial"] as const;

export type LeadFlowType = (typeof LEAD_FLOW_TYPES)[number];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "demo_scheduled",
  "demo_done",
  "counseling",
  "admission",
  "payment_pending",
  "payment_confirmed",
  "mentor_assigned",
  "closed_won",
  "closed_lost",
  "demo",
  "closed",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadNoteEntry = {
  text: string;
  timestamp: string;
  addedBy: string;
};

export const FLOW_TYPE_BADGE_CLASS: Record<LeadFlowType, string> = {
  tuition: "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200",
  remedial: "bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200",
};

export const STATUS_BADGE_CLASS: Record<LeadStatus, string> = {
  new: "bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200",
  contacted: "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200",
  demo_scheduled: "bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-200",
  demo_done: "bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  counseling: "bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200",
  admission: "bg-teal-100 text-teal-700 ring-1 ring-inset ring-teal-200",
  payment_pending: "bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200",
  payment_confirmed: "bg-green-100 text-green-700 ring-1 ring-inset ring-green-200",
  mentor_assigned: "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  closed_won: "bg-green-900 text-green-50 ring-1 ring-inset ring-green-950/30",
  closed_lost: "bg-red-100 text-red-700 ring-1 ring-inset ring-red-200",
  demo: "bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-200",
  closed: "bg-red-100 text-red-700 ring-1 ring-inset ring-red-200",
};

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  demo_scheduled: "Demo Scheduled",
  demo_done: "Demo Done",
  counseling: "Back to Counseling",
  admission: "Admission Confirmed",
  payment_pending: "Payment Pending",
  payment_confirmed: "Payment Confirmed",
  mentor_assigned: "Mentor Assigned",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
  demo: "Demo",
  closed: "Closed",
};

export type LeadStep = {
  key:
    | "contacted"
    | "demo_scheduled"
    | "demo_done"
    | "counseling"
    | "admission"
    | "payment_pending"
    | "payment_confirmed"
    | "mentor_assigned";
  label: string;
};

export const LEAD_PIPELINE_STEPS: LeadStep[] = [
  { key: "contacted", label: "Contacted" },
  { key: "demo_scheduled", label: "Demo Scheduled" },
  { key: "demo_done", label: "Demo Done" },
  { key: "counseling", label: "Back to Counseling" },
  { key: "admission", label: "Admission Confirmed" },
  { key: "payment_pending", label: "Payment Pending" },
  { key: "payment_confirmed", label: "Payment Confirmed" },
  { key: "mentor_assigned", label: "Mentor Assigned" },
];

const PROGRESS_RANK: Record<LeadStatus, number> = {
  new: 0,
  contacted: 1,
  demo_scheduled: 2,
  demo_done: 3,
  counseling: 4,
  admission: 5,
  payment_pending: 6,
  payment_confirmed: 7,
  mentor_assigned: 8,
  closed_won: 9,
  closed_lost: -1,
  demo: 2,
  closed: -1,
};

export function normalizeLeadFlowType(value: string | null | undefined): LeadFlowType {
  return value === "remedial" ? "remedial" : "tuition";
}

export function normalizeLeadStatus(value: string | null | undefined): LeadStatus {
  switch (value) {
    case "contacted":
    case "demo_scheduled":
    case "demo_done":
    case "counseling":
    case "admission":
    case "payment_pending":
    case "payment_confirmed":
    case "mentor_assigned":
    case "closed_won":
    case "closed_lost":
    case "demo":
    case "closed":
      return value;
    default:
      return "new";
  }
}

export function getLeadStepIndex(
  statusInput: string | null | undefined,
  flowTypeInput: string | null | undefined,
): number {
  const status = normalizeLeadStatus(statusInput);
  const flowType = normalizeLeadFlowType(flowTypeInput);
  if (status === "closed_lost" || status === "closed") return -1;
  if (status === "closed_won") return 7;
  if (flowType === "remedial") {
    if (status === "new") return 0;
    if (status === "contacted") return 0;
    if (status === "admission") return 4;
    if (status === "payment_pending") return 5;
    if (status === "payment_confirmed") return 6;
    if (status === "mentor_assigned") return 7;
  }
  switch (status) {
    case "contacted":
      return 0;
    case "demo":
    case "demo_scheduled":
      return 1;
    case "demo_done":
      return 2;
    case "counseling":
      return 3;
    case "admission":
      return 4;
    case "payment_pending":
      return 5;
    case "payment_confirmed":
      return 6;
    case "mentor_assigned":
      return 7;
    default:
      return 0;
  }
}

export function getNextLeadStatus(
  statusInput: string | null | undefined,
  flowTypeInput: string | null | undefined,
): LeadStatus | null {
  const status = normalizeLeadStatus(statusInput);
  const flowType = normalizeLeadFlowType(flowTypeInput);

  if (status === "new") return "contacted";
  if (status === "contacted") {
    return flowType === "remedial" ? "admission" : "demo_scheduled";
  }
  if (status === "demo_scheduled") return "demo_done";
  if (status === "demo_done") return "counseling";
  if (status === "counseling") return "admission";
  if (status === "admission") return "payment_pending";
  if (status === "payment_pending") return "payment_confirmed";
  if (status === "payment_confirmed") return "mentor_assigned";
  return null;
}

export function getAdvanceButtonLabel(
  statusInput: string | null | undefined,
  flowTypeInput: string | null | undefined,
): string | null {
  const status = normalizeLeadStatus(statusInput);
  const flowType = normalizeLeadFlowType(flowTypeInput);

  if (status === "new") return "Mark as Contacted";
  if (status === "contacted") {
    return flowType === "remedial" ? "Confirm Admission" : "Schedule Demo";
  }
  if (status === "demo_scheduled") return "Mark Demo Done";
  if (status === "demo_done") return "Back to Counseling";
  if (status === "counseling") return "Confirm Admission";
  if (status === "admission") return "Mark Payment Pending";
  if (status === "payment_pending") return "Process Payment";
  return null;
}

export function isLeadStepDisabledForFlow(
  stepKey: LeadStep["key"],
  flowTypeInput: string | null | undefined,
): boolean {
  const flowType = normalizeLeadFlowType(flowTypeInput);
  return (
    flowType === "remedial" &&
    (stepKey === "demo_scheduled" ||
      stepKey === "demo_done" ||
      stepKey === "counseling")
  );
}

export function getLegacyLeadStatus(statusInput: string | null | undefined): "new" | "demo" | "admission" | "closed" {
  const status = normalizeLeadStatus(statusInput);
  if (status === "closed_lost" || status === "closed") return "closed";
  if (
    status === "admission" ||
    status === "payment_pending" ||
    status === "payment_confirmed" ||
    status === "mentor_assigned" ||
    status === "closed_won"
  ) {
    return "admission";
  }
  if (
    status === "demo" ||
    status === "demo_scheduled" ||
    status === "demo_done" ||
    status === "counseling"
  ) {
    return "demo";
  }
  return "new";
}

export function isAllowedLeadStatusTransition(
  currentInput: string | null | undefined,
  nextInput: string | null | undefined,
): boolean {
  const current = normalizeLeadStatus(currentInput);
  const next = normalizeLeadStatus(nextInput);

  if (next === "closed_lost") return current !== "closed_won";
  if (current === "closed_lost" || current === "closed" || current === "closed_won") {
    return false;
  }

  return PROGRESS_RANK[next] >= PROGRESS_RANK[current];
}

export function parseLeadNotes(raw: string | null | undefined): LeadNoteEntry[] {
  if (!raw?.trim()) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error("notes is not an array");
    }
    return parsed
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null;
        const row = entry as Record<string, unknown>;
        const text = typeof row.text === "string" ? row.text.trim() : "";
        const timestamp =
          typeof row.timestamp === "string" && row.timestamp.trim()
            ? row.timestamp
            : new Date().toISOString();
        const addedBy =
          typeof row.addedBy === "string" && row.addedBy.trim()
            ? row.addedBy
            : "Unknown";
        if (!text) return null;
        return { text, timestamp, addedBy };
      })
      .filter((entry): entry is LeadNoteEntry => entry !== null);
  } catch {
    return [
      {
        text: raw.trim(),
        timestamp: new Date(0).toISOString(),
        addedBy: "Legacy",
      },
    ];
  }
}

export function appendLeadNote(
  raw: string | null | undefined,
  note: { text: string; addedBy: string; timestamp?: string },
): string {
  const entries = parseLeadNotes(raw);
  entries.push({
    text: note.text.trim(),
    addedBy: note.addedBy.trim() || "Unknown",
    timestamp: note.timestamp ?? new Date().toISOString(),
  });
  return JSON.stringify(entries);
}

export function extractParentNameFromLeadNotes(
  raw: string | null | undefined,
): string | null {
  const entries = parseLeadNotes(raw);
  for (const entry of entries) {
    const match = entry.text.match(/Parent:\s*([^.]+?)(?:\.|$)/i);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }
  return null;
}

export type AccountProgramType = "tuition" | "remedial_12" | "remedial_25";

export function determineProgramTypeFromLead(input: {
  type: string | null | undefined;
  notes: string | null | undefined;
}): AccountProgramType {
  if (input.type === "remedial") {
    const haystack = `${input.notes ?? ""}`.toLowerCase();
    if (haystack.includes("25-day") || haystack.includes("remedial_25")) {
      return "remedial_25";
    }
    if (haystack.includes("12-day") || haystack.includes("remedial_12")) {
      return "remedial_12";
    }
  }
  return "tuition";
}

export function getProgramDisplayLabel(programType: AccountProgramType): string {
  if (programType === "remedial_25") return "Remedial 25-day";
  if (programType === "remedial_12") return "Remedial 12-day";
  return "One-to-One Tuition";
}
