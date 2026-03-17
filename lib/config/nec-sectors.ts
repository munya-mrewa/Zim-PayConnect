export type NecSectorId = "GENERIC" | "COMMERCIAL" | "MINING" | "AGRICULTURE" | "MANUFACTURING";

export interface NecSectorPreset {
  id: NecSectorId;
  name: string;
  description: string;
  defaultRate: number;
}

export const NEC_SECTORS: NecSectorPreset[] = [
  {
    id: "GENERIC",
    name: "Generic / Custom",
    description: "Manually configure NEC rate as per your council.",
    defaultRate: 0.0,
  },
  {
    id: "COMMERCIAL",
    name: "Commercial Sector",
    description: "Typical commercial NEC councils (e.g. NEC Commercial).",
    defaultRate: 0.02,
  },
  {
    id: "MINING",
    name: "Mining Sector",
    description: "Mining-specific NEC agreements.",
    defaultRate: 0.015,
  },
  {
    id: "AGRICULTURE",
    name: "Agriculture Sector",
    description: "Farming and agriculture NEC structures.",
    defaultRate: 0.01,
  },
  {
    id: "MANUFACTURING",
    name: "Manufacturing Sector",
    description: "Industrial / manufacturing NEC arrangements.",
    defaultRate: 0.018,
  },
];

