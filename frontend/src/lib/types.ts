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
