// Raw price record from parser JSON
export interface RawPriceRecord {
  cropName: string;
  mandiName: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit?: string;
  arrival?: number;
  source?: string;
}

// Normalized price document matching server schema
export interface PriceDocument {
  cropId: string;
  cropName: string;
  mandiId: string;
  mandiName: string;
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  date: Date;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  arrival?: number;
  source: string;
  sourceId?: string;
  apmcCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Loader log entry for missing mappings
export interface LoaderLogEntry {
  type: "missing_crop" | "missing_mandi";
  rawName: string;
  source: string;
  date: string;
  record: RawPriceRecord;
  createdAt: Date;
}

// Crop mapping from index.json
export interface CropIndexEntry {
  id: string;
  name: string;
  commodityGroup: string;
  sourceId?: number;
}

// APMC mapping from index.json
export interface ApmcIndexEntry {
  mandiId: string;
  stateId: string;
  districtId?: string;
  districtName?: string;
}

// Source-specific name mappings
export type NameMapping = Record<string, string>;

// Map data structure
export interface LoadedMaps {
  cropMap: NameMapping;        // rawName -> canonicalId
  cropIndex: Record<string, CropIndexEntry>;  // canonicalId -> details
  apmcMap: NameMapping;        // rawName -> canonicalId
  apmcIndex: Record<string, ApmcIndexEntry>;  // canonicalId -> details
}

// Processing stats
export interface LoadStats {
  processed: number;
  inserted: number;
  failed: number;
  missingCrops: number;
  missingMandis: number;
}
