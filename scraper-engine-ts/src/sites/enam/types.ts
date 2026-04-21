export interface EnamRawRecord {
  id: string;
  state: string;
  apmc: string;
  commodity: string;
  min_price: string;
  modal_price: string;
  max_price: string;
  commodity_arrivals: string;
  commodity_traded: string;
  created_at: string;
  status: string;
  Commodity_Uom: string;
}

export interface EnamScrapeResult {
  site: "enam";
  sourceUrl: string;
  fetchedAt: string;
  sourceDate: string;
  records: EnamRawRecord[];
  meta: Record<string, unknown>;
}

export interface EnamMappedRecord {
  sourceId: string;
  stateName: string;
  mandiName: string;
  cropName: string;
  date: string;
  minPrice: string;
  maxPrice: string;
  modalPrice: string;
  arrival: string;
  traded: string;
  unit: string;
  status: string;
}

export interface EnamNormalizedRecord {
  cropId: string;
  cropName: string;
  mandiId: string;
  mandiName: string;
  stateId: string;
  stateName: string;
  districtId?: string;
  districtName: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  arrival: number | null;
  source: "enam";
  sourceId: string;
}
