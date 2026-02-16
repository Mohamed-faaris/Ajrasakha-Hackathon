export type ISODateString = string;

export type PriceSource = 'agmarknet' | 'enam' | 'apmc' | 'other' | 'mandi-insights';
export type SortDirection = 'asc' | 'desc';
export type PriceSortBy = 'date' | 'crop' | 'state' | 'mandi' | 'modalPrice';
export type AlertDirection = 'above' | 'below';
export type TopMoverDirection = 'up' | 'down';
export type Language = 'en' | 'hi' | 'mr' | 'te' | 'ta' | 'kn' | 'gu' | 'pa';

export interface Filters {
  cropId?: string;
  stateId?: string;
  dateFrom?: ISODateString;
  dateTo?: ISODateString;
  source?: PriceSource;
  search?: string;
  [key: string]: string | undefined;
}

export interface Crop {
  id: string;
  name: string;
  commodityGroup?: string;
}

export interface State {
  id: string;
  name: string;
  code?: string;
}

export interface Location {
  type: 'Point';
  coordinates: [number, number];
}

export interface Mandi {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
  latitude: number;
  longitude: number;
}

export interface Price {
  id: string;
  cropId: string;
  cropName: string;
  mandiId: string;
  mandiName: string;
  stateId: string;
  stateName: string;
  date: ISODateString;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  arrival?: number;
  source?: PriceSource;
}

export interface Alert {
  id: string;
  cropId: string;
  cropName: string;
  mandiId?: string;
  mandiName?: string;
  thresholdPrice: number;
  direction: AlertDirection;
  isActive: boolean;
  triggeredAt?: ISODateString;
  message?: string;
}

export interface TopMover {
  cropId: string;
  cropName: string;
  latestPrice: number;
  previousPrice: number;
  changePct: number;
  direction: TopMoverDirection;
}

export interface Coverage {
  totalApmcs: number;
  coveredApmcs: number;
  coveragePercent: number;
  statesCovered: number;
  lastUpdated: ISODateString;
}

export interface PriceTrendPoint {
  date: ISODateString;
  modalPrice: number;
}

export interface PriceTrend {
  _id: string;
  cacheKey: string;
  cropId: string;
  mandiId: string;
  stateId?: string | null;
  data: PriceTrendPoint[];
  computedAt: Date;
}

export interface MandiPrice {
  mandiId: string;
  mandiName: string;
  cropId: string;
  cropName?: string;
  stateName: string;
  latitude: number;
  longitude: number;
  modalPrice: number;
  date: ISODateString;
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
    priceAlerts: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
  sms: {
    enabled: boolean;
    priceAlerts: boolean;
  };
  push: {
    enabled: boolean;
    priceAlerts: boolean;
  };
}

export interface FarmerDetails {
  isFarmer: boolean;
  farmSize?: number | null;
  farmLocation?: {
    type: 'Point';
    coordinates: [number, number];
  } | null;
  primaryCrops?: string[] | null;
}

export interface TraderDetails {
  isTrader: boolean;
  companyName?: string | null;
  gstNumber?: string | null;
  tradingStates?: string[] | null;
}

export interface UserProfile {
  _id: string;
  userId: string;
  phone?: string | null;
  state?: string | null;
  district?: string | null;
  preferredCrops?: string[] | null;
  preferredMandis?: string[] | null;
  notificationSettings: NotificationSettings;
  language: Language;
  avatar?: string | null;
  farmerDetails?: FarmerDetails | null;
  traderDetails?: TraderDetails | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface ApiListResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface GetPricesQuery extends Pagination {
  cropId?: string;
  stateId?: string;
  mandiId?: string;
  districtId?: string;
  dateFrom?: string;
  dateTo?: string;
  source?: PriceSource;
  sortBy?: 'date' | 'cropId' | 'stateId' | 'mandiId' | 'modalPrice';
  sortOrder?: SortDirection;
}

export interface GetLatestPricesQuery {
  cropId?: string;
  mandiId?: string;
  limit: number;
}

export interface GetPriceTrendsQuery {
  cropId: string;
  mandiId: string;
  days: number;
}

export interface GetMandisInBoundsQuery {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface SearchQuery {
  q: string;
}

export interface CreateAlertBody {
  cropId: string;
  mandiId?: string;
  thresholdPrice: number;
  direction: AlertDirection;
}

export interface UpdateAlertBody {
  thresholdPrice?: number;
  direction?: AlertDirection;
  isActive?: boolean;
}

export interface ToggleAlertBody {
  isActive: boolean;
}

export interface GetMandiPricesQuery {
  stateName?: string;
  cropId?: string;
}

export interface GetMandiPricesInBoundsQuery extends GetMandisInBoundsQuery {
  cropId?: string;
}

export interface GetTopMoversQuery {
  direction?: TopMoverDirection;
  limit: number;
}

export interface UpdateUserProfileBody {
  phone?: string;
  state?: string;
  district?: string;
  preferredCrops?: string[];
  preferredMandis?: string[];
  notificationSettings?: Partial<NotificationSettings>;
  language?: Language;
  avatar?: string;
  farmerDetails?: Partial<FarmerDetails>;
  traderDetails?: Partial<TraderDetails>;
}

export interface GeoBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}
