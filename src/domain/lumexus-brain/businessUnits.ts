import type { BusinessUnitId } from "./types.ts";

export const BUSINESS_UNITS = [
  "lumexus-ai",
  "muscle-boulevard",
  "cypher-biopeptides",
  "real-peptide-news",
  "repolife",
  "omniroute",
  "jarvis",
] as const satisfies readonly BusinessUnitId[];

const BUSINESS_UNIT_IDS = new Set<string>(BUSINESS_UNITS);

export function isBusinessUnitId(value: unknown): value is BusinessUnitId {
  return typeof value === "string" && BUSINESS_UNIT_IDS.has(value);
}
