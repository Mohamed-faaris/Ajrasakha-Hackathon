import type { EnamMappedRecord, EnamRawRecord } from "./types.js";

export const enamFieldMap = {
  id: "sourceId",
  state: "stateName",
  apmc: "mandiName",
  commodity: "cropName",
  created_at: "date",
  min_price: "minPrice",
  max_price: "maxPrice",
  modal_price: "modalPrice",
  commodity_arrivals: "arrival",
  commodity_traded: "traded",
  Commodity_Uom: "unit",
  status: "status",
} as const;

export function mapEnamRecord(record: EnamRawRecord): EnamMappedRecord {
  return {
    sourceId: record.id,
    stateName: record.state,
    mandiName: record.apmc,
    cropName: record.commodity,
    date: record.created_at,
    minPrice: record.min_price,
    maxPrice: record.max_price,
    modalPrice: record.modal_price,
    arrival: record.commodity_arrivals,
    traded: record.commodity_traded,
    unit: record.Commodity_Uom,
    status: record.status,
  };
}

export function mapEnamRecords(records: EnamRawRecord[]): EnamMappedRecord[] {
  return records.map(mapEnamRecord);
}
