export {
  type District,
  type DataSource,
  type CropPrice,
  type CropInfo,
  type PriceTrendPoint,
  type ArbitrageOpportunity,
  type PriceAlert,
  type StateCoverage,
  type TopMoverDirection,
  type AlertDirection,
  type UserRole,
  type Language,
  type NotificationSettings,
  type FarmerDetails,
  type TraderDetails,
  type PolicyMakerDetails,
  type AgriStartupDetails,
  type UserProfile,
  type UpdateUserProfileBody,
} from "@shared/types";

export type { FrontendPriceTrend as PriceTrend } from "@shared/types";
export type { FrontendState as State } from "@shared/types";

import type { Mandi as SharedMandi, TopMover as SharedTopMover } from "@shared/types";

export interface Mandi extends Omit<SharedMandi, 'stateId' | 'stateName' | 'latitude' | 'longitude'> {
  stateId?: string;
  stateName?: string;
  latitude?: number;
  longitude?: number;
}

export interface TopMover extends Partial<SharedTopMover> {
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
