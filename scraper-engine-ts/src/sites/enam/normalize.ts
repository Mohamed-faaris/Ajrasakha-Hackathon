import { parseDate, parseNumber, parseOptionalNumber } from "../../utils.js";
import type { EnamMappedRecord, EnamNormalizedRecord } from "./types.js";
import { resolveCrop, resolveMandi, resolveStateId } from "../../data/lookup.js";

export function normalizeEnamRecord(record: EnamMappedRecord): EnamNormalizedRecord {
  const stateLookup = resolveStateId(record.stateName);
  const mandiLookup = resolveMandi(record.stateName, record.mandiName);
  const cropLookup = resolveCrop(record.cropName);

  const stateName = stateLookup?.stateName || record.stateName.trim().toUpperCase();
  const stateId = stateLookup?.stateId || "";
  const mandiName = mandiLookup?.name?.trim().toUpperCase() || record.mandiName.trim().toUpperCase();
  const mandiId = mandiLookup?._id || "";
  const cropName = cropLookup?.name?.trim().toUpperCase() || record.cropName.trim().toUpperCase();
  const cropId = cropLookup?._id || "";

  return {
    cropId,
    cropName,
    mandiId,
    mandiName,
    stateId,
    stateName,
    districtId: mandiLookup?.districtId,
    districtName: mandiLookup?.districtName?.trim().toUpperCase() || stateName,
    date: parseDate(record.date),
    minPrice: parseNumber(record.minPrice),
    maxPrice: parseNumber(record.maxPrice),
    modalPrice: parseNumber(record.modalPrice),
    unit: record.unit?.trim() || "Qui",
    arrival: parseOptionalNumber(record.arrival),
    source: "enam",
    sourceId: record.sourceId,
  };
}

export function normalizeEnamRecords(records: EnamMappedRecord[]): EnamNormalizedRecord[] {
  return records.map(normalizeEnamRecord);
}
