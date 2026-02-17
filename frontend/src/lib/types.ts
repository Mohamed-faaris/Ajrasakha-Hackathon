export interface State {
  code: string;
  name: string;
}

export interface District {
  name: string;
  stateCode: string;
}

export interface Mandi {
  id: string;
  name: string;
  district: string;
  stateCode: string;
  isEnamIntegrated: boolean;
  source: DataSource;
  lastUpdated: string;
}

export type DataSource = "eNAM" | "Agmarknet" | "State Portal";

export interface CropPrice {
  id: string;
  date: string;
  stateCode: string;
  state: string;
  district: string;
  mandi: string;
  crop: string;
  variety: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  source: DataSource;
}

export interface CropInfo {
  name: string;
  category: string;
  mspPrice?: number;
}

export interface PriceTrend {
  date: string;
  price: number;
  minPrice: number;
  maxPrice: number;
}

export interface ArbitrageOpportunity {
  crop: string;
  variety: string;
  mandiA: string;
  stateA: string;
  priceA: number;
  mandiB: string;
  stateB: string;
  priceB: number;
  priceDiff: number;
  distanceKm: number;
}

export interface PriceAlert {
  id: string;
  crop: string;
  state: string;
  thresholdType: "above" | "below";
  thresholdPrice: number;
  isActive: boolean;
}

export interface StateCoverage {
  stateCode: string;
  state: string;
  totalApmcs: number;
  enamIntegrated: number;
  statePortal: number;
  uncovered: number;
  avgPrice?: number;
}

export interface TopMover {
  crop: string;
  state: string;
  changePercent: number;
  currentPrice: number;
  previousPrice: number;
  direction: "up" | "down";
}

export type UserRole = "farmer" | "trader" | "policy_maker" | "agri_startup";

export interface FarmerProfileDetails {
  isFarmer?: boolean;
  farmSize?: number;
  primaryCrops?: string[];
}

export interface TraderProfileDetails {
  isTrader?: boolean;
  companyName?: string;
  gstNumber?: string;
  tradingStates?: string[];
}

export interface PolicyMakerProfileDetails {
  organization?: string;
  designation?: string;
  policyFocusAreas?: string[];
}

export interface AgriStartupProfileDetails {
  startupName?: string;
  stage?: "idea" | "mvp" | "early" | "growth" | "scale";
  focusAreas?: string[];
}

export interface UserProfile {
  _id?: string;
  userId?: string;
  role: UserRole;
  phone?: string;
  state?: string;
  district?: string;
  preferredCrops?: string[];
  preferredMandis?: string[];
  language?: "en" | "hi" | "mr" | "te" | "ta" | "kn" | "gu" | "pa";
  avatar?: string;
  farmerDetails?: FarmerProfileDetails;
  traderDetails?: TraderProfileDetails;
  policyMakerDetails?: PolicyMakerProfileDetails;
  agriStartupDetails?: AgriStartupProfileDetails;
  classification?: {
    method: "self_declared" | "rule_based";
    confidence: number;
    evaluatedAt: string;
  };
}
