import path from "node:path";
import { readFileSync } from "node:fs";
import { getRepoRoot, slugify, toUpper } from "../utils.js";

interface SeedCrop {
  _id: string;
  name: string;
}

interface SeedMandi {
  _id: string;
  name: string;
  stateId: string;
  stateName: string;
  districtId?: string;
  districtName?: string;
  sourceMandiId?: string;
}

interface StateCodeMap {
  [stateName: string]: string;
}

let cachedCrops: SeedCrop[] | null = null;
let cachedMandis: SeedMandi[] | null = null;
let cachedStateCodeMap: StateCodeMap | null = null;

function normalizeLookupKey(value: string): string {
  return toUpper(value).replace(/\s+/g, " ").trim();
}

function normalizeMandiKey(value: string): string {
  return normalizeLookupKey(value)
    .replace(/\s+APMC$/i, "")
    .replace(/\s+MKT$/i, "")
    .replace(/\s+MARKET$/i, "")
    .trim();
}

function candidateStateNames(stateName: string): string[] {
  const normalized = normalizeLookupKey(stateName);
  const candidates = new Set<string>([
    normalized,
    normalized.replace(/\./g, ""),
  ]);

  if (normalized === "PUDUCHERRY") {
    candidates.add("PONDICHERRY");
  }

  if (normalized === "ODISHA") {
    candidates.add("ORISSA");
  }

  if (normalized === "TELANGANA") {
    candidates.add("TELANGANA");
  }

  if (normalized === "ANDAMAN AND NICOBAR ISLANDS") {
    candidates.add("ANDAMAN AND NICOBAR");
  }

  return [...candidates];
}

const ENAM_CROP_ALIASES: Record<string, string> = {
  "CHILLI-TEJA": "DRY CHILLIES",
  "CHILLI-THAALU": "DRY CHILLIES",
  "CHILLI-DEVANURU DELUX": "DRY CHILLIES",
};

export function resolveCrop(name: string): SeedCrop | null {
  const crops = cachedCrops ?? (cachedCrops = JSON.parse(readFileSync(path.join(getRepoRoot(import.meta.url), "seeder", "data", "crops.converted.json"), "utf8")) as SeedCrop[]);
  const normalized = normalizeLookupKey(name);
  const alias = ENAM_CROP_ALIASES[normalized];
  if (alias) {
    const aliasMatch = crops.find((crop) => normalizeLookupKey(crop.name) === normalizeLookupKey(alias));
    if (aliasMatch) {
      return aliasMatch;
    }
  }

  const exact = crops.find((crop) => normalizeLookupKey(crop.name) === normalized);
  if (exact) {
    return exact;
  }

  const slug = slugify(name);
  const slugMatch = crops.find((crop) => crop._id === slug);
  if (slugMatch) {
    return slugMatch;
  }

  const wordMatch = crops.find((crop) => {
    const cropKey = normalizeLookupKey(crop.name);
    const nameKey = normalized;
    const words = nameKey.split(/\s+/).filter((word) => word.length > 2);
    return words.some((word) => cropKey.includes(word) || nameKey.includes(cropKey));
  });
  if (wordMatch) {
    return wordMatch;
  }

  if (normalized.startsWith("PADDY")) {
    const common = crops.find((crop) => normalizeLookupKey(crop.name) === "PADDY(COMMON)");
    if (common) {
      return common;
    }

    const basmati = crops.find((crop) => normalizeLookupKey(crop.name) === "PADDY(BASMATI)");
    if (basmati) {
      return basmati;
    }

    const anyPaddy = crops.find((crop) => normalizeLookupKey(crop.name).includes("PADDY"));
    if (anyPaddy) {
      return anyPaddy;
    }
  }

  return null;
}

export function resolveMandi(stateName: string, mandiName: string): SeedMandi | null {
  const mandis = cachedMandis ?? (cachedMandis = JSON.parse(readFileSync(path.join(getRepoRoot(import.meta.url), "seeder", "data", "mandis.converted.json"), "utf8")) as SeedMandi[]);
  const stateCandidates = candidateStateNames(stateName);
  const mandiNormalized = normalizeMandiKey(mandiName);

  const exact = mandis.find((mandi) =>
    stateCandidates.includes(normalizeLookupKey(mandi.stateName)) &&
    normalizeMandiKey(mandi.name) === mandiNormalized
  );
  if (exact) {
    return exact;
  }

  const fallback = mandis.find((mandi) =>
    normalizeMandiKey(mandi.name) === mandiNormalized ||
    normalizeMandiKey(mandi.name).includes(mandiNormalized) ||
    mandiNormalized.includes(normalizeMandiKey(mandi.name))
  );
  return fallback || null;
}

export function resolveStateId(stateName: string): { stateId: string; stateName: string } | null {
  const map = cachedStateCodeMap ?? (cachedStateCodeMap = JSON.parse(readFileSync(path.join(getRepoRoot(import.meta.url), "seeder", "data", "stateCodeMap.json"), "utf8")) as StateCodeMap);
  const normalized = normalizeLookupKey(stateName);
  const direct = Object.entries(map).find(([name]) => normalizeLookupKey(name) === normalized);
  if (direct) {
    return { stateId: direct[1], stateName: normalized };
  }

  if (normalized === "PUDUCHERRY") {
    return { stateId: "PY", stateName: normalized };
  }

  return null;
}
