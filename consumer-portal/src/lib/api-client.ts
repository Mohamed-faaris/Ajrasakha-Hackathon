import { z } from "zod";
import {
  ApiError,
  ValidationError,
  isApiError,
} from "./api-errors";
import {
  CropPriceSchema,
  CropInfoSchema,
  FrontendStateSchema,
  MandiSchema,
  TopMoverSchema,
  StateCoverageSchema,
  ArbitrageOpportunitySchema,
  FrontendPriceTrendSchema,
  CreateAlertBodySchema,
  PriceAlertSchema,
  NotificationSettingsSchema,
  LanguageSchema,
} from "@shared/schemas";
import type {
  CropPrice,
  CropInfo,
  FrontendState,
  Mandi,
  TopMover,
  StateCoverage,
  ArbitrageOpportunity,
  FrontendPriceTrend,
  PriceAlert,
  AlertDirection,
  NotificationSettings,
  Language,
} from "@shared/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export interface QuickStats {
  totalApmcs: number;
  cropsTracked: number;
  todaysUpdates: number;
  statesCovered: number;
  enamIntegrated: number;
  statePortalCovered: number;
  uncovered: number;
}

export const QuickStatsSchema = z.object({
  totalApmcs: z.number(),
  cropsTracked: z.number(),
  todaysUpdates: z.number(),
  statesCovered: z.number(),
  enamIntegrated: z.number(),
  statePortalCovered: z.number(),
  uncovered: z.number(),
});

export interface PriceFilters {
  state?: string;
  district?: string;
  mandi?: string;
  crop?: string;
  source?: string;
}

export interface UserProfileSettings {
  phone?: string;
  state?: string;
  district?: string;
  preferredCrops?: string[];
  preferredMandis?: string[];
  language?: Language;
  avatar?: string;
  farmerDetails?: {
    isFarmer?: boolean;
    farmSize?: number;
    primaryCrops?: string[];
  };
  traderDetails?: {
    isTrader?: boolean;
    companyName?: string;
    gstNumber?: string;
    tradingStates?: string[];
  };
}

export interface ProfilePreferences {
  language?: Language;
  state?: string;
  district?: string;
  preferredCrops: string[];
  preferredMandis: string[];
  avatar?: string;
}

export interface ProfileSecurity {
  email?: string;
  name?: string;
  phone?: string;
  session: {
    id: string;
    expiresAt: string | Date;
  } | null;
}

const UserProfileSettingsSchema: z.ZodType<UserProfileSettings> = z.object({
  phone: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  preferredCrops: z.array(z.string()).optional(),
  preferredMandis: z.array(z.string()).optional(),
  notificationSettings: NotificationSettingsSchema.optional(),
  language: LanguageSchema.optional(),
  avatar: z.string().optional(),
  farmerDetails: z
    .object({
      isFarmer: z.boolean().optional(),
      farmSize: z.number().optional(),
      primaryCrops: z.array(z.string()).optional(),
    })
    .optional(),
  traderDetails: z
    .object({
      isTrader: z.boolean().optional(),
      companyName: z.string().optional(),
      gstNumber: z.string().optional(),
      tradingStates: z.array(z.string()).optional(),
    })
    .optional(),
});

const ProfilePreferencesSchema: z.ZodType<ProfilePreferences> = z.object({
  language: LanguageSchema.optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  preferredCrops: z.array(z.string()).default([]),
  preferredMandis: z.array(z.string()).default([]),
  avatar: z.string().optional(),
});

const ProfileSecuritySchema: z.ZodType<ProfileSecurity> = z.object({
  email: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  session: z
    .object({
      id: z.string(),
      expiresAt: z.union([z.string(), z.coerce.date()]),
    })
    .nullable(),
});

type QueryParams = Record<string, string | number | boolean | undefined>;

const sourceMap: Record<string, string> = {
  "eNAM": "enam",
  "Agmarknet": "agmarknet",
  "State Portal": "apmc",
};

function transformFilters(filters?: PriceFilters): QueryParams {
  if (!filters) return {};
  const params: QueryParams = { ...filters };
  if (filters.source && sourceMap[filters.source]) {
    params.source = sourceMap[filters.source];
  }
  if (filters.state) {
    params.stateId = filters.state;
    delete params.state;
  }
  if (filters.crop) {
    params.cropId = filters.crop.toLowerCase().replace(/\s+/g, '-');
    delete params.crop;
  }
  return params;
}

function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  params?: QueryParams,
  options?: RequestOptions
): Promise<T> {
  const url = `${API_BASE_URL}${path}${buildQuery(params)}`;
  const { method = "GET", body, headers, signal } = options ?? {};

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError(0, "Network Error", "Network request failed");
  }

  if (!response.ok) {
    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      try {
        responseBody = await response.text();
      } catch {
        responseBody = undefined;
      }
    }
    throw ApiError.fromResponse(
      response.status,
      response.statusText,
      responseBody
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      response.statusText,
      "Failed to parse response body"
    );
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error, "Response validation failed");
  }

  return result.data;
}

export const apiClient = {
  getPrices: (filters?: PriceFilters): Promise<CropPrice[]> =>
    request("/prices", z.array(CropPriceSchema), transformFilters(filters)),

  getCrops: (): Promise<CropInfo[]> =>
    request("/crops", z.array(CropInfoSchema)),

  getStates: (): Promise<FrontendState[]> =>
    request("/states", z.array(FrontendStateSchema)),

  getMandis: (stateCode?: string): Promise<Mandi[]> =>
    request(
      "/mandis",
      z.array(MandiSchema),
      stateCode ? { stateCode } : undefined
    ),

  getTopMovers: (): Promise<TopMover[]> =>
    request("/top-movers", z.array(TopMoverSchema)),

  getStateCoverage: (): Promise<StateCoverage[]> =>
    request("/state-coverage", z.array(StateCoverageSchema)),

  getArbitrageOpportunities: (): Promise<ArbitrageOpportunity[]> =>
    request("/arbitrage-opportunities", z.array(ArbitrageOpportunitySchema)),

  getPriceTrend: (crop: string, months?: number): Promise<FrontendPriceTrend[]> =>
    request(
      "/price-trend",
      z.array(FrontendPriceTrendSchema),
      { crop, months }
    ),

  getQuickStats: (): Promise<QuickStats> =>
    request("/quick-stats", QuickStatsSchema),

  getAlerts: (): Promise<PriceAlert[]> =>
    request("/alerts", z.array(PriceAlertSchema)),

  createAlert: (payload: {
    crop: string;
    threshold: number;
    type: AlertDirection;
  }): Promise<PriceAlert> => {
    const body = CreateAlertBodySchema.parse({
      cropId: payload.crop,
      thresholdPrice: payload.threshold,
      direction: payload.type,
    });
    return request("/alerts", PriceAlertSchema, undefined, {
      method: "POST",
      body,
    });
  },

  deleteAlert: (id: string): Promise<void> =>
    request(`/alerts/${id}`, z.void(), undefined, { method: "DELETE" }),

  getProfileSettings: (): Promise<UserProfileSettings> =>
    request("/profile/settings", UserProfileSettingsSchema),

  updateProfileSettings: (payload: UserProfileSettings): Promise<UserProfileSettings> =>
    request("/profile/settings", UserProfileSettingsSchema, undefined, {
      method: "PATCH",
      body: payload,
    }),

  getNotificationSettings: (): Promise<NotificationSettings> =>
    request("/profile/notifications", NotificationSettingsSchema),

  updateNotificationSettings: (payload: NotificationSettings): Promise<NotificationSettings> =>
    request("/profile/notifications", NotificationSettingsSchema, undefined, {
      method: "PATCH",
      body: payload,
    }),

  getProfilePreferences: (): Promise<ProfilePreferences> =>
    request("/profile/preferences", ProfilePreferencesSchema),

  updateProfilePreferences: (payload: Partial<ProfilePreferences>): Promise<ProfilePreferences> =>
    request("/profile/preferences", ProfilePreferencesSchema, undefined, {
      method: "PATCH",
      body: payload,
    }),

  getProfileSecurity: (): Promise<ProfileSecurity> =>
    request("/profile/security", ProfileSecuritySchema),

  updateProfileSecurity: (payload: { phone?: string }): Promise<{ phone?: string }> =>
    request("/profile/security", z.object({ phone: z.string().optional() }), undefined, {
      method: "PATCH",
      body: payload,
    }),

  request,
};

export {
  ApiError,
  ValidationError,
  isApiError,
};

export type { ApiErrorResponse } from "./api-errors";