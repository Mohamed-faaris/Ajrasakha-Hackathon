import { z } from 'zod';

export const PriceSourceSchema = z.enum(['agmarknet', 'enam', 'apmc', 'other']);
export const SortDirectionSchema = z.enum(['asc', 'desc']);
export const AlertDirectionSchema = z.enum(['above', 'below']);
export const TopMoverDirectionSchema = z.enum(['up', 'down']);
export const LanguageSchema = z.enum(['en', 'hi', 'mr', 'te', 'ta', 'kn', 'gu', 'pa']);

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

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const GetPricesQuerySchema = PaginationSchema.extend({
  cropId: z.string().optional(),
  stateId: z.string().optional(),
  mandiId: z.string().optional(),
  districtId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  source: PriceSourceSchema.optional(),
  sortBy: z.enum(['date', 'cropId', 'stateId', 'mandiId', 'modalPrice']).default('date'),
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

export const NotificationSettingsSchema = z.object({
  email: z.object({
    enabled: z.boolean().default(true),
    priceAlerts: z.boolean().default(true),
    dailyDigest: z.boolean().default(false),
    weeklyReport: z.boolean().default(true),
  }),
  sms: z.object({
    enabled: z.boolean().default(false),
    priceAlerts: z.boolean().default(false),
  }),
  push: z.object({
    enabled: z.boolean().default(true),
    priceAlerts: z.boolean().default(true),
  }),
});

export const FarmerDetailsSchema = z.object({
  isFarmer: z.boolean().default(false),
  farmSize: z.number().optional(),
  farmLocation: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }).optional(),
  primaryCrops: z.array(z.string()).optional(),
});

export const TraderDetailsSchema = z.object({
  isTrader: z.boolean().default(false),
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  tradingStates: z.array(z.string()).optional(),
});

export const CreateAlertBodySchema = z.object({
  cropId: z.string().min(1),
  mandiId: z.string().optional(),
  thresholdPrice: z.number().min(0),
  direction: AlertDirectionSchema,
});

export const UpdateAlertBodySchema = z.object({
  thresholdPrice: z.number().min(0).optional(),
  direction: AlertDirectionSchema.optional(),
  isActive: z.boolean().optional(),
});

export const ToggleAlertBodySchema = z.object({
  isActive: z.boolean(),
});

export const UpdateUserProfileBodySchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  preferredCrops: z.array(z.string()).optional(),
  preferredMandis: z.array(z.string()).optional(),
  notificationSettings: NotificationSettingsSchema.partial().optional(),
  language: LanguageSchema.optional(),
  avatar: z.string().optional(),
  farmerDetails: FarmerDetailsSchema.partial().optional(),
  traderDetails: TraderDetailsSchema.partial().optional(),
});
