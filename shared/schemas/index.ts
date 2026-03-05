import { z } from 'zod';

export const PriceSourceSchema = z.enum(['agmarknet', 'enam', 'apmc', 'other', 'mandi-insights']);
export const DataSourceSchema = z.enum(['eNAM', 'Agmarknet', 'State Portal']);
export const SortDirectionSchema = z.enum(['asc', 'desc']);
export const PriceSortBySchema = z.enum(['date', 'crop', 'state', 'mandi', 'modalPrice']);
export const AlertDirectionSchema = z.enum(['above', 'below']);
export const AlertTypeSchema = z.enum(['price', 'trend', 'both']);
export const TrendDirectionSchema = z.enum(['increase', 'decrease']);
export const TopMoverDirectionSchema = z.enum(['up', 'down']);
export const LanguageSchema = z.enum(['en', 'hi', 'mr', 'te', 'ta', 'kn', 'gu', 'pa']);
export const UserRoleSchema = z.enum(['farmer', 'trader', 'policy_maker', 'agri_startup']);

export const FiltersSchema = z.object({
  cropId: z.string().optional(),
  stateId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  source: PriceSourceSchema.optional(),
  search: z.string().optional(),
});

export const CropSchema = z.object({
  id: z.string(),
  name: z.string(),
  commodityGroup: z.string().optional(),
});

export const StateSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().optional(),
});

export const DistrictSchema = z.object({
  name: z.string(),
  stateCode: z.string(),
});

export const LocationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]),
});

export const MandiSchema = z.object({
  id: z.string(),
  name: z.string(),
  stateId: z.string(),
  stateName: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  district: z.string().optional(),
  stateCode: z.string().optional(),
  isEnamIntegrated: z.boolean().optional(),
  source: DataSourceSchema.optional(),
  lastUpdated: z.string().optional(),
});

export const PriceSchema = z.object({
  id: z.string(),
  cropId: z.string(),
  cropName: z.string(),
  mandiId: z.string(),
  mandiName: z.string(),
  stateId: z.string(),
  stateName: z.string(),
  date: z.string(),
  minPrice: z.number(),
  maxPrice: z.number(),
  modalPrice: z.number(),
  unit: z.string(),
  arrival: z.number().optional(),
  source: PriceSourceSchema.optional(),
});

export const AlertSchema = z.object({
  id: z.string(),
  cropId: z.string(),
  cropName: z.string(),
  mandiId: z.string().optional(),
  mandiName: z.string().optional(),
  thresholdPrice: z.number(),
  direction: AlertDirectionSchema,
  isActive: z.boolean(),
  triggeredAt: z.string().optional(),
  message: z.string().optional(),
});

export const TopMoverSchema = z.object({
  cropId: z.string(),
  cropName: z.string(),
  latestPrice: z.number(),
  previousPrice: z.number(),
  changePct: z.number(),
  direction: TopMoverDirectionSchema,
  crop: z.string().optional(),
  state: z.string().optional(),
  changePercent: z.number().optional(),
  currentPrice: z.number().optional(),
});

export const CoverageSchema = z.object({
  totalApmcs: z.number(),
  coveredApmcs: z.number(),
  coveragePercent: z.number(),
  statesCovered: z.number(),
  lastUpdated: z.string(),
});

export const PriceTrendPointSchema = z.object({
  date: z.string(),
  modalPrice: z.number(),
  price: z.number().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
});

export const MandiPriceSchema = z.object({
  mandiId: z.string(),
  mandiName: z.string(),
  cropId: z.string(),
  cropName: z.string().optional(),
  stateName: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  modalPrice: z.number(),
  date: z.string(),
});

export const NotificationSettingsSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    priceAlerts: z.boolean(),
    dailyDigest: z.boolean(),
    weeklyReport: z.boolean(),
  }),
  sms: z.object({
    enabled: z.boolean(),
    priceAlerts: z.boolean(),
  }),
  push: z.object({
    enabled: z.boolean(),
    priceAlerts: z.boolean(),
  }),
});

export const FarmerDetailsSchema = z.object({
  isFarmer: z.boolean(),
  farmSize: z.number().optional(),
  farmLocation: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }).optional(),
  primaryCrops: z.array(z.string()).optional(),
});

export const TraderDetailsSchema = z.object({
  isTrader: z.boolean(),
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  tradingStates: z.array(z.string()).optional(),
});

export const PolicyMakerDetailsSchema = z.object({
  organization: z.string().optional(),
  designation: z.string().optional(),
  policyFocusAreas: z.array(z.string()).optional(),
});

export const AgriStartupDetailsSchema = z.object({
  startupName: z.string().optional(),
  stage: z.enum(['idea', 'mvp', 'early', 'growth', 'scale']).optional(),
  focusAreas: z.array(z.string()).optional(),
});

export const UserProfileSchema = z.object({
  userId: z.string(),
  role: UserRoleSchema.optional(),
  phone: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  preferredCrops: z.array(z.string()).optional(),
  preferredMandis: z.array(z.string()).optional(),
  notificationSettings: NotificationSettingsSchema,
  language: LanguageSchema,
  avatar: z.string().optional(),
  farmerDetails: FarmerDetailsSchema.optional(),
  traderDetails: TraderDetailsSchema.optional(),
  policyMakerDetails: PolicyMakerDetailsSchema.optional(),
  agriStartupDetails: AgriStartupDetailsSchema.optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  emailVerified: z.boolean().optional(),
});

export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.coerce.date(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const ApiListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
  });

export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});

export const GetByIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const GetByStateParamsSchema = z.object({
  stateId: z.string().min(1),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1),
});

export const BoundsQuerySchema = z.object({
  minLng: z.coerce.number(),
  minLat: z.coerce.number(),
  maxLng: z.coerce.number(),
  maxLat: z.coerce.number(),
});

export const GetPricesQuerySchema = PaginationSchema.extend({
  cropId: z.string().optional(),
  stateId: z.string().optional(),
  mandiId: z.string().optional(),
  districtId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  source: PriceSourceSchema.optional(),
  sortBy: z.enum(['date', 'crop', 'state', 'mandi', 'modalPrice']).default('date'),
  sortOrder: SortDirectionSchema.default('desc'),
});

export const GetLatestPricesQuerySchema = z.object({
  cropId: z.string().optional(),
  mandiId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const GetPriceTrendsQuerySchema = z.object({
  cropId: z.string().min(1),
  mandiId: z.string().min(1),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

export const GetMandiPricesQuerySchema = z.object({
  stateName: z.string().optional(),
  cropId: z.string().optional(),
});

export const GetMandiPricesInBoundsQuerySchema = BoundsQuerySchema.extend({
  cropId: z.string().optional(),
});

export const GetTopMoversQuerySchema = z.object({
  direction: TopMoverDirectionSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const LimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const AlertIdParamsSchema = z.object({
  alertId: z.string().min(1),
});

export const MandiIdParamsSchema = z.object({
  mandiId: z.string().min(1),
});

export const GetByMandiAndCropParamsSchema = z.object({
  mandiId: z.string().min(1),
  cropId: z.string().min(1),
});

export const PricesByMandiAndCropQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const CreateAlertBodySchema = z.object({
  alertType: AlertTypeSchema.default('price'),
  cropId: z.string().min(1),
  mandiId: z.string().optional(),
  thresholdPrice: z.number().min(0).optional(),
  priceDirection: AlertDirectionSchema.optional(),
  percentage: z.number().min(0).optional(),
  days: z.number().int().min(1).optional(),
  trendDirection: TrendDirectionSchema.optional(),
  cooldownHours: z.number().int().min(0).default(24),
}).refine(
  (data) => {
    if (data.alertType === 'price' || data.alertType === 'both') {
      return data.thresholdPrice !== undefined;
    }
    return true;
  },
  {
    message: 'thresholdPrice is required for price alerts',
    path: ['thresholdPrice'],
  }
).refine(
  (data) => {
    if (data.alertType === 'trend' || data.alertType === 'both') {
      return data.percentage !== undefined && data.days !== undefined;
    }
    return true;
  },
  {
    message: 'percentage and days are required for trend alerts',
    path: ['percentage'],
  }
);

export const ToggleAlertBodySchema = z.object({
  isActive: z.boolean(),
});

export const UpdateAlertBodySchema = z.object({
  thresholdPrice: z.number().min(0).optional(),
  priceDirection: AlertDirectionSchema.optional(),
  percentage: z.number().min(0).optional(),
  days: z.number().int().min(1).optional(),
  trendDirection: TrendDirectionSchema.optional(),
  cooldownHours: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const RegisterFCMTokenSchema = z.object({
  token: z.string().min(1),
  device: z.string().optional(),
});

export const ProcessAlertResultSchema = z.object({
  alertId: z.string(),
  triggered: z.boolean(),
  triggeredAt: z.string().optional(),
  message: z.string().optional(),
  priceAtTrigger: z.number().optional(),
  previousPrice: z.number().optional(),
  changePercent: z.number().optional(),
  triggeredBy: z.enum(['price', 'trend']).optional(),
});

export const UpdateUserProfileBodySchema = z.object({
  role: UserRoleSchema.optional(),
  phone: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  preferredCrops: z.array(z.string()).optional(),
  preferredMandis: z.array(z.string()).optional(),
  notificationSettings: NotificationSettingsSchema.partial().optional(),
  language: LanguageSchema.optional(),
  avatar: z.string().optional(),
  farmerDetails: FarmerDetailsSchema.partial().optional(),
  traderDetails: TraderDetailsSchema.partial().optional(),
  policyMakerDetails: PolicyMakerDetailsSchema.partial().optional(),
  agriStartupDetails: AgriStartupDetailsSchema.partial().optional(),
});

export const CropPriceSchema = z.object({
  id: z.string(),
  date: z.string(),
  stateCode: z.string(),
  state: z.string(),
  district: z.string(),
  mandi: z.string(),
  crop: z.string(),
  variety: z.string(),
  minPrice: z.number(),
  maxPrice: z.number(),
  modalPrice: z.number(),
  unit: z.string(),
  source: DataSourceSchema,
});

export const CropInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  mspPrice: z.number().optional(),
});

export const ArbitrageOpportunitySchema = z.object({
  crop: z.string(),
  variety: z.string(),
  mandiA: z.string(),
  stateA: z.string(),
  priceA: z.number(),
  mandiB: z.string(),
  stateB: z.string(),
  priceB: z.number(),
  priceDiff: z.number(),
  distanceKm: z.number(),
});

export const PriceAlertSchema = z.object({
  id: z.string(),
  crop: z.string(),
  state: z.string(),
  thresholdType: AlertDirectionSchema,
  thresholdPrice: z.number(),
  isActive: z.boolean(),
});

export const StateCoverageSchema = z.object({
  stateCode: z.string(),
  state: z.string(),
  totalApmcs: z.number(),
  enamIntegrated: z.number(),
  statePortal: z.number(),
  uncovered: z.number(),
  avgPrice: z.number().optional(),
});

export const FrontendStateSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const FrontendPriceTrendSchema = z.object({
  date: z.string(),
  price: z.number(),
  minPrice: z.number(),
  maxPrice: z.number(),
});

export const PredictionDaySchema = z.object({
  date: z.string(),
  predictedPrice: z.number(),
  confidence: z.number(),
});

export const PredictionResultSchema = z.object({
  cropId: z.string(),
  mandiId: z.string(),
  predictions: z.array(PredictionDaySchema),
  trend: z.enum(['Bullish', 'Bearish', 'Neutral']),
  generatedAt: z.coerce.date(),
  expiresAt: z.coerce.date(),
});

export const PredictionStatusSchema = z.object({
  hasValidPrediction: z.boolean(),
  expiresAt: z.coerce.date().nullable(),
  generatedAt: z.coerce.date().nullable(),
  trend: z.enum(['Bullish', 'Bearish', 'Neutral']).nullable(),
});

export const PredictionDataCheckSchema = z.object({
  hasEnoughData: z.boolean(),
  priceCount: z.number(),
  minRequired: z.number(),
  hasPrediction: z.boolean(),
});
