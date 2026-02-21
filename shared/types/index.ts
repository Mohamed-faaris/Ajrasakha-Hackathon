export type ISODateString = string;

export type PriceSource = 'agmarknet' | 'enam' | 'apmc' | 'other' | 'mandi-insights';
export type DataSource = 'eNAM' | 'Agmarknet' | 'State Portal';
export type SortDirection = 'asc' | 'desc';
export type PriceSortBy = 'date' | 'crop' | 'state' | 'mandi' | 'modalPrice';
export type AlertDirection = 'above' | 'below';
export type TopMoverDirection = 'up' | 'down';
export type Language = 'en' | 'hi' | 'mr' | 'te' | 'ta' | 'kn' | 'gu' | 'pa';
export type UserRole = 'farmer' | 'trader' | 'policy_maker' | 'agri_startup';

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

export interface FrontendState {
  code: string;
  name: string;
}

export interface Location {
  type: 'Point';
  coordinates: [number, number];
}

export interface District {
  name: string;
  stateCode: string;
}

export interface Mandi {
  id: string;
  name: string;
  stateId: string;
  stateName: string;
  latitude: number;
  longitude: number;
  district?: string;
  stateCode?: string;
  isEnamIntegrated?: boolean;
  source?: DataSource;
  lastUpdated?: string;
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
  crop?: string;
  state?: string;
  changePercent?: number;
  currentPrice?: number;
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
  price?: number;
  minPrice?: number;
  maxPrice?: number;
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

export interface FrontendPriceTrend {
  date: string;
  price: number;
  minPrice: number;
  maxPrice: number;
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

export interface PolicyMakerDetails {
  organization?: string | null;
  designation?: string | null;
  policyFocusAreas?: string[] | null;
}

export interface AgriStartupDetails {
  startupName?: string | null;
  stage?: 'idea' | 'mvp' | 'early' | 'growth' | 'scale' | null;
  focusAreas?: string[] | null;
}

export interface UserProfile {
  _id: string;
  userId: string;
  role?: UserRole | null;
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
  policyMakerDetails?: PolicyMakerDetails | null;
  agriStartupDetails?: AgriStartupDetails | null;
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
  sortBy?: 'date' | 'crop' | 'state' | 'mandi' | 'modalPrice';
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
  role?: UserRole;
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
  policyMakerDetails?: Partial<PolicyMakerDetails>;
  agriStartupDetails?: Partial<AgriStartupDetails>;
}

export interface GeoBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

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
  thresholdType: AlertDirection;
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
