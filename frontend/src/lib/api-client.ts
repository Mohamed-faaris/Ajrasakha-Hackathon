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
} from "@shared/schemas";
import type {
  CropPrice,
  CropInfo,
  State,
  Mandi,
  TopMover,
  StateCoverage,
  ArbitrageOpportunity,
  FrontendPriceTrend,
  PriceAlert,
  AlertDirection,
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

type QueryParams = Record<string, string | number | boolean | undefined>;

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

function getAuthHeaders(): Record<string, string> {
  return {};
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
    request("/prices", z.array(CropPriceSchema), filters as QueryParams),

  getCrops: (): Promise<CropInfo[]> =>
    request("/crops", z.array(CropInfoSchema)),

  getStates: (): Promise<State[]> =>
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

  request,
};

export {
  ApiError,
  ValidationError,
  isApiError,
};

export type { ApiErrorResponse } from "./api-errors";