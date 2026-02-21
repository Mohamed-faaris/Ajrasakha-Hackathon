import type {
  ArbitrageOpportunity,
  CropInfo,
  CropPrice,
  Mandi,
  PriceTrend,
  State,
  StateCoverage,
  TopMover,
  UserProfile,
  UpdateUserProfileBody,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export interface PriceFilters {
  state?: string;
  district?: string;
  mandi?: string;
  crop?: string;
  source?: string;
}

export interface QuickStats {
  totalApmcs: number;
  cropsTracked: number;
  todaysUpdates: number;
  statesCovered: number;
  enamIntegrated: number;
  statePortalCovered: number;
  uncovered: number;
}

export interface UserAlert {
  id: string;
  crop: string;
  threshold: number;
  type: "above" | "below";
}

const buildQuery = (params?: Record<string, string | number | undefined>) => {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

const request = async <T>(path: string, params?: Record<string, string | number | undefined>, init?: RequestInit): Promise<T> => {
  const url = `${API_BASE_URL}${path}${buildQuery(params)}`;
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};

export const api = {
  getPrices: (filters?: PriceFilters): Promise<CropPrice[]> =>
    request<CropPrice[]>("/prices", filters as Record<string, string | number | undefined>),

  getCrops: (): Promise<CropInfo[]> => request<CropInfo[]>("/crops"),

  getStates: (): Promise<State[]> => request<State[]>("/states"),

  getMandis: (stateCode?: string): Promise<Mandi[]> =>
    request<Mandi[]>("/mandis", stateCode ? { stateCode } : undefined),

  getTopMovers: (): Promise<TopMover[]> => request<TopMover[]>("/top-movers"),

  getStateCoverage: (): Promise<StateCoverage[]> => request<StateCoverage[]>("/state-coverage"),

  getArbitrageOpportunities: (): Promise<ArbitrageOpportunity[]> =>
    request<ArbitrageOpportunity[]>("/arbitrage-opportunities"),

  getPriceTrend: (crop: string, months?: number): Promise<PriceTrend[]> =>
    request<PriceTrend[]>("/price-trend", { crop, months }),

  getQuickStats: (): Promise<QuickStats> => request<QuickStats>("/quick-stats"),

  getAlerts: (): Promise<UserAlert[]> => request<UserAlert[]>("/alerts"),

  createAlert: (payload: { crop: string; threshold: number; type: "above" | "below" }): Promise<UserAlert> =>
    request<UserAlert>("/alerts", undefined, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteAlert: (id: string): Promise<void> =>
    request<void>(`/alerts/${id}`, undefined, {
      method: "DELETE",
    }),

  getMyProfile: (): Promise<UserProfile | null> =>
    request<UserProfile | null>("/profile"),

  updateMyProfile: (payload: UpdateUserProfileBody): Promise<UserProfile> =>
    request<UserProfile>("/profile", undefined, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
