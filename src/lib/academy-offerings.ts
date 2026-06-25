export const DELIVERY_MODES = [
  "offline",
  "online_gmeet",
  "recorded",
] as const;

export type DeliveryMode = (typeof DELIVERY_MODES)[number];

export type AcademyBrandKey = "hmc" | "motiva_edus" | "nirvana";

export type AcademyOffering = {
  key: string;
  brand: AcademyBrandKey;
  brandName: string;
  programName: string;
  mode: DeliveryMode;
  label: string;
  leadType: "tuition" | "foundation" | "remedial";
  flowType: "tuition" | "remedial";
  shortNote: string;
};

const modeLabel: Record<DeliveryMode, string> = {
  offline: "Offline",
  online_gmeet: "Online Google Meet",
  recorded: "Recorded",
};

function offering(
  key: string,
  brand: AcademyBrandKey,
  brandName: string,
  programName: string,
  mode: DeliveryMode,
  leadType: AcademyOffering["leadType"],
  flowType: AcademyOffering["flowType"] = "tuition",
  shortNote?: string,
): AcademyOffering {
  return {
    key,
    brand,
    brandName,
    programName,
    mode,
    label: `${brandName} - ${programName} - ${modeLabel[mode]}`,
    leadType,
    flowType,
    shortNote:
      shortNote ??
      `${brandName} ${programName}, ${modeLabel[mode]} support.`,
  };
}

export const ACADEMY_OFFERINGS: AcademyOffering[] = [
  offering(
    "hmc_public_speaking_offline",
    "hmc",
    "HMC",
    "Public Speaking",
    "offline",
    "foundation",
  ),
  offering(
    "hmc_public_speaking_online",
    "hmc",
    "HMC",
    "Public Speaking",
    "online_gmeet",
    "foundation",
    "tuition",
    "HMC public speaking through Google Meet with WhatsApp group support.",
  ),
  offering(
    "hmc_wpst_recorded",
    "hmc",
    "HMC",
    "WPST Public Speaking",
    "recorded",
    "foundation",
    "tuition",
    "WPST recorded public speaking training.",
  ),
  offering(
    "motiva_one_to_one_offline",
    "motiva_edus",
    "Motiva Edus",
    "One-to-One Tuition",
    "offline",
    "tuition",
  ),
  offering(
    "motiva_one_to_one_online",
    "motiva_edus",
    "Motiva Edus",
    "One-to-One Tuition",
    "online_gmeet",
    "tuition",
    "tuition",
    "One-to-one tuition through Google Meet with WhatsApp follow-up.",
  ),
  offering(
    "motiva_one_to_one_recorded",
    "motiva_edus",
    "Motiva Edus",
    "One-to-One Tuition",
    "recorded",
    "tuition",
  ),
  offering(
    "motiva_foundation_remedial_offline",
    "motiva_edus",
    "Motiva Edus",
    "Foundation / Remedial Classes",
    "offline",
    "remedial",
    "remedial",
  ),
  offering(
    "motiva_foundation_remedial_online",
    "motiva_edus",
    "Motiva Edus",
    "Foundation / Remedial Classes",
    "online_gmeet",
    "remedial",
    "remedial",
    "Foundation and remedial support through Google Meet with WhatsApp follow-up.",
  ),
  offering(
    "motiva_foundation_remedial_recorded",
    "motiva_edus",
    "Motiva Edus",
    "Foundation / Remedial Classes",
    "recorded",
    "remedial",
    "remedial",
  ),
  offering(
    "motiva_madrassa_tuition_offline",
    "motiva_edus",
    "Motiva Edus",
    "Madrassa Tuition",
    "offline",
    "tuition",
  ),
  offering(
    "motiva_madrassa_tuition_online",
    "motiva_edus",
    "Motiva Edus",
    "Madrassa Tuition",
    "online_gmeet",
    "tuition",
  ),
  offering(
    "motiva_madrassa_tuition_recorded",
    "motiva_edus",
    "Motiva Edus",
    "Madrassa Tuition",
    "recorded",
    "tuition",
  ),
  offering(
    "motiva_spoken_english_offline",
    "motiva_edus",
    "Motiva Edus",
    "Spoken English",
    "offline",
    "foundation",
  ),
  offering(
    "motiva_spoken_english_online",
    "motiva_edus",
    "Motiva Edus",
    "Spoken English",
    "online_gmeet",
    "foundation",
  ),
  offering(
    "motiva_spoken_english_recorded",
    "motiva_edus",
    "Motiva Edus",
    "Spoken English",
    "recorded",
    "foundation",
  ),
  offering(
    "nirvana_offline",
    "nirvana",
    "Nirvana",
    "Training Program",
    "offline",
    "foundation",
  ),
  offering(
    "nirvana_online",
    "nirvana",
    "Nirvana",
    "Training Program",
    "online_gmeet",
    "foundation",
  ),
  offering(
    "nirvana_recorded",
    "nirvana",
    "Nirvana",
    "Training Program",
    "recorded",
    "foundation",
  ),
];

export function getOffering(key: string | null | undefined): AcademyOffering | null {
  if (!key) return null;
  return ACADEMY_OFFERINGS.find((item) => item.key === key) ?? null;
}

export function getOfferingLabel(key: string | null | undefined): string {
  return getOffering(key)?.label ?? (key ? key.replace(/_/g, " ") : "");
}

export function getOfferingModeLabel(mode: DeliveryMode): string {
  return modeLabel[mode];
}

export function getOfferingsByBrand() {
  return [
    {
      key: "hmc",
      name: "HMC",
      offerings: ACADEMY_OFFERINGS.filter((item) => item.brand === "hmc"),
    },
    {
      key: "motiva_edus",
      name: "Motiva Edus",
      offerings: ACADEMY_OFFERINGS.filter((item) => item.brand === "motiva_edus"),
    },
    {
      key: "nirvana",
      name: "Nirvana",
      offerings: ACADEMY_OFFERINGS.filter((item) => item.brand === "nirvana"),
    },
  ];
}
