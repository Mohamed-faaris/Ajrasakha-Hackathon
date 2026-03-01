import { STATE_CODE_MAP, SOURCE_ENUM_MAP } from "./config.js";
import type { RawPriceRecord, PriceDocument, LoadedMaps, LoaderLogEntry } from "./types.js";

export interface NormalizationResult {
  document?: PriceDocument;
  logEntry?: LoaderLogEntry;
  success: boolean;
}

export function normalizeRecord(
  record: RawPriceRecord,
  source: string,
  maps: LoadedMaps
): NormalizationResult {
  const now = new Date();
  
  // Normalize crop
  const cropResult = normalizeCrop(record.cropName, maps);
  if (!cropResult.found) {
    return {
      success: false,
      logEntry: {
        type: "missing_crop",
        rawName: record.cropName,
        source,
        date: record.date,
        record,
        createdAt: now,
      },
    };
  }
  
  // Normalize mandi
  const mandiResult = normalizeMandi(record.mandiName, maps);
  if (!mandiResult.found) {
    return {
      success: false,
      logEntry: {
        type: "missing_mandi",
        rawName: record.mandiName,
        source,
        date: record.date,
        record,
        createdAt: now,
      },
    };
  }
  
  // Get state info
  const stateCode = mandiResult.stateId || "UNKNOWN";
  const stateName = STATE_CODE_MAP[stateCode] || "UNKNOWN";
  
  // Get district info
  const districtId = mandiResult.districtId || "unknown";
  const districtName = mandiResult.districtName || "UNKNOWN";
  
  // Build document matching server schema exactly
  const document: PriceDocument = {
    cropId: cropResult.id!,
    cropName: cropResult.name!.toUpperCase(),
    mandiId: mandiResult.id!,
    mandiName: mandiResult.name!.toUpperCase(),
    stateId: stateCode.toLowerCase(),
    stateName: stateName,
    districtId: districtId.toLowerCase(),
    districtName: districtName.toUpperCase(),
    date: new Date(record.date),
    minPrice: normalizePrice(record.minPrice),
    maxPrice: normalizePrice(record.maxPrice),
    modalPrice: normalizePrice(record.modalPrice),
    unit: normalizeUnit(record.unit),
    arrival: record.arrival ? normalizePrice(record.arrival) : undefined,
    source: SOURCE_ENUM_MAP[source] || "other",
    sourceId: record.source || source,
    createdAt: now,
    updatedAt: now,
  };
  
  return { success: true, document };
}

interface NormalizedCrop {
  found: boolean;
  id?: string;
  name?: string;
  commodityGroup?: string;
}

function normalizeCrop(rawName: string, maps: LoadedMaps): NormalizedCrop {
  if (!rawName) {
    return { found: false };
  }
  
  const normalizedRaw = rawName.toUpperCase().trim();
  
  // Try source-specific map first
  const canonicalId = maps.cropMap[normalizedRaw];
  if (canonicalId) {
    const cropInfo = maps.cropIndex[canonicalId];
    if (cropInfo) {
      return {
        found: true,
        id: cropInfo.id,
        name: cropInfo.name,
        commodityGroup: cropInfo.commodityGroup,
      };
    }
  }
  
  // Try direct lookup in crop index (fallback)
  const lowerName = rawName.toLowerCase().trim().replace(/\s+/g, "-");
  const directMatch = maps.cropIndex[lowerName];
  if (directMatch) {
    return {
      found: true,
      id: directMatch.id,
      name: directMatch.name,
      commodityGroup: directMatch.commodityGroup,
    };
  }
  
  // Try name matching
  for (const entry of Object.values(maps.cropIndex)) {
    if (entry.name.toUpperCase() === normalizedRaw) {
      return {
        found: true,
        id: entry.id,
        name: entry.name,
        commodityGroup: entry.commodityGroup,
      };
    }
  }
  
  return { found: false };
}

interface NormalizedMandi {
  found: boolean;
  id?: string;
  name?: string;
  stateId?: string;
  districtId?: string;
  districtName?: string;
}

function normalizeMandi(rawName: string, maps: LoadedMaps): NormalizedMandi {
  if (!rawName) {
    return { found: false };
  }
  
  const normalizedRaw = rawName.toUpperCase().trim();
  
  // Try source-specific map first
  const canonicalId = maps.apmcMap[normalizedRaw];
  if (canonicalId) {
    const apmcInfo = maps.apmcIndex[canonicalId];
    if (apmcInfo) {
      return {
        found: true,
        id: apmcInfo.mandiId,
        name: rawName, // Use raw name for display
        stateId: apmcInfo.stateId,
        districtId: apmcInfo.districtId,
        districtName: apmcInfo.districtName,
      };
    }
  }
  
  // Try direct lookup in APMC index
  const lowerName = rawName.toLowerCase().trim();
  const directMatch = maps.apmcIndex[lowerName];
  if (directMatch) {
    return {
      found: true,
      id: directMatch.mandiId,
      name: rawName,
      stateId: directMatch.stateId,
      districtId: directMatch.districtId,
      districtName: directMatch.districtName,
    };
  }
  
  return { found: false };
}

function normalizePrice(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function normalizeUnit(unit?: string): string {
  if (!unit) return "QUI";
  const normalized = unit.toUpperCase().trim();
  if (normalized.includes("QUINTAL") || normalized === "QUINTAL") return "QUI";
  if (normalized.includes("KG") || normalized === "KILOGRAM") return "KG";
  if (normalized.includes("TON") || normalized === "TONNE") return "TON";
  return "QUI";
}
