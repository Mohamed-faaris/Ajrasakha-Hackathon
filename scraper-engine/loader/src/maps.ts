import { PATHS } from "./config.js";
import type { LoadedMaps, NameMapping, CropIndexEntry, ApmcIndexEntry } from "./types.js";

export async function loadMaps(source: string): Promise<LoadedMaps> {
  const [cropMap, cropIndex, apmcMap, apmcIndex] = await Promise.all([
    loadCropMap(source),
    loadCropIndex(),
    loadApmcMap(source),
    loadApmcIndex(),
  ]);

  return {
    cropMap,
    cropIndex,
    apmcMap,
    apmcIndex,
  };
}

async function loadCropMap(source: string): Promise<NameMapping> {
  const path = `${PATHS.cropMap}/${source}.json`;
  
  try {
    const file = Bun.file(path);
    if (await file.exists()) {
      const content = await file.text();
      const data = JSON.parse(content) as Record<string, string>;
      // Normalize keys to uppercase for case-insensitive lookup
      const normalized: NameMapping = {};
      for (const [key, value] of Object.entries(data)) {
        normalized[key.toUpperCase().trim()] = value;
      }
      return normalized;
    }
  } catch {
    // Fall through to empty map
  }
  
  // Try generic agmarknet map as fallback
  if (source !== "agmarknet") {
    try {
      const fallbackPath = `${PATHS.cropMap}/agmarknet.json`;
      const file = Bun.file(fallbackPath);
      if (await file.exists()) {
        const content = await file.text();
        const data = JSON.parse(content) as Record<string, string>;
        const normalized: NameMapping = {};
        for (const [key, value] of Object.entries(data)) {
          normalized[key.toUpperCase().trim()] = value;
        }
        return normalized;
      }
    } catch {
      // Fall through
    }
  }
  
  console.warn(`No crop map found for source: ${source}`);
  return {};
}

async function loadCropIndex(): Promise<Record<string, CropIndexEntry>> {
  const path = `${PATHS.cropMap}/index.json`;
  
  try {
    const file = Bun.file(path);
    const content = await file.text();
    return JSON.parse(content) as Record<string, CropIndexEntry>;
  } catch (error) {
    console.error(`Failed to load crop index from ${path}:`, error);
    return {};
  }
}

async function loadApmcMap(source: string): Promise<NameMapping> {
  const path = `${PATHS.apmcMap}/${source}.json`;
  
  try {
    const file = Bun.file(path);
    if (await file.exists()) {
      const content = await file.text();
      const data = JSON.parse(content) as Record<string, { mandiId: string; stateId: string }>;
      // Build mapping: uppercase name -> mandiId, and also populate apmcIndex data
      const mapping: NameMapping = {};
      for (const [key, value] of Object.entries(data)) {
        mapping[key.toUpperCase().trim()] = value.mandiId;
      }
      return mapping;
    }
  } catch {
    // Fall through to empty map
  }
  
  console.warn(`No APMC map found for source: ${source}`);
  return {};
}

async function loadApmcIndex(): Promise<Record<string, ApmcIndexEntry>> {
  const path = `${PATHS.apmcMap}/index.json`;
  
  try {
    const file = Bun.file(path);
    const content = await file.text();
    const data = JSON.parse(content) as Record<string, { mandiId: string; stateId: string }>;
    
    // Build index keyed by mandiId for quick lookup
    const index: Record<string, ApmcIndexEntry> = {};
    for (const [, value] of Object.entries(data)) {
      const parts = value.mandiId.split("-");
      const districtId = parts.length >= 2 ? parts[1] : "unknown";
      
      // Key by mandiId
      index[value.mandiId] = {
        mandiId: value.mandiId,
        stateId: value.stateId,
        districtId,
        districtName: districtId.toUpperCase(),
      };
    }
    
    return index;
  } catch (error) {
    console.error(`Failed to load APMC index from ${path}:`, error);
    return {};
  }
}
