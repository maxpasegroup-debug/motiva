export const MENTOR_CATEGORIES = [
  "foundation",
  "tuition",
  "spoken_english",
  "madrassa",
] as const;

export type MentorCategory = (typeof MENTOR_CATEGORIES)[number];

export const MENTOR_CATEGORY_LABEL: Record<MentorCategory, string> = {
  foundation: "Foundation / Remedial",
  tuition: "Tuition",
  spoken_english: "Spoken English",
  madrassa: "Madrassa",
};

export function normalizeMentorCategory(
  value: unknown,
): MentorCategory | null {
  return MENTOR_CATEGORIES.includes(value as MentorCategory)
    ? (value as MentorCategory)
    : null;
}

export function determineMentorCategory(input: {
  type?: string | null;
  flowType?: string | null;
  subjects?: string | null;
  notes?: string | null;
}): MentorCategory {
  const text = [
    input.type,
    input.flowType,
    input.subjects,
    input.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.includes("spoken")) return "spoken_english";
  if (text.includes("madrassa") || text.includes("madrasa")) return "madrassa";
  if (
    text.includes("remedial") ||
    text.includes("foundation") ||
    input.type === "foundation" ||
    input.flowType === "remedial"
  ) {
    return "foundation";
  }

  return "tuition";
}
