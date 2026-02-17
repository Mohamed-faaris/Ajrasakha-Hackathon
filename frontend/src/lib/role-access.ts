import type { UserRole } from "@/lib/types";

export type RoleCapability =
  | "realtime_price_dashboard"
  | "price_trend_analytics"
  | "geographic_comparison"
  | "smart_alerts"
  | "simple_reports"
  | "arbitrage_detection"
  | "multi_market_comparison"
  | "volatility_risk_analysis"
  | "bulk_export"
  | "coverage_gap_visualization"
  | "state_level_analytics"
  | "price_anomaly_detection"
  | "predictive_insights"
  | "policy_reports"
  | "api_access"
  | "bulk_historical_data_access"
  | "data_visualization_tools"
  | "data_quality_indicators";

export interface RoleAccess {
  capabilities: RoleCapability[];
  restrictions: string[];
  allowedRoutes: string[];
}

export const ROLE_ACCESS: Record<UserRole, RoleAccess> = {
  farmer: {
    capabilities: [
      "realtime_price_dashboard",
      "price_trend_analytics",
      "geographic_comparison",
      "smart_alerts",
      "simple_reports",
    ],
    restrictions: [
      "No scraping controls",
      "No raw dataset exports",
      "No admin controls",
    ],
    allowedRoutes: ["/", "/dashboard", "/analytics", "/map", "/reports", "/profile"],
  },
  trader: {
    capabilities: [
      "realtime_price_dashboard",
      "price_trend_analytics",
      "geographic_comparison",
      "smart_alerts",
      "simple_reports",
      "arbitrage_detection",
      "multi_market_comparison",
      "volatility_risk_analysis",
      "bulk_export",
    ],
    restrictions: [
      "No price data modification",
      "No scraping controls",
    ],
    allowedRoutes: ["/", "/dashboard", "/analytics", "/map", "/arbitrage", "/reports", "/profile"],
  },
  policy_maker: {
    capabilities: [
      "coverage_gap_visualization",
      "state_level_analytics",
      "price_anomaly_detection",
      "predictive_insights",
      "policy_reports",
    ],
    restrictions: [
      "No data editing",
      "No scraping controls",
    ],
    allowedRoutes: ["/", "/dashboard", "/analytics", "/map", "/reports", "/profile"],
  },
  agri_startup: {
    capabilities: [
      "api_access",
      "bulk_historical_data_access",
      "data_visualization_tools",
      "data_quality_indicators",
    ],
    restrictions: [
      "No platform scraping",
      "Rate-limited API usage",
    ],
    allowedRoutes: ["/", "/dashboard", "/analytics", "/map", "/reports", "/profile"],
  },
};

export const isRoleAllowedForRoute = (role: UserRole | undefined, route: string) => {
  const resolvedRole: UserRole = role || "farmer";
  const allowedRoutes = ROLE_ACCESS[resolvedRole].allowedRoutes;
  return allowedRoutes.includes(route);
};

export const hasRoleCapability = (role: UserRole | undefined, capability: RoleCapability) => {
  const resolvedRole: UserRole = role || "farmer";
  return ROLE_ACCESS[resolvedRole].capabilities.includes(capability);
};

export const CAPABILITY_LABELS: Record<RoleCapability, string> = {
  realtime_price_dashboard: "Real-time price dashboard",
  price_trend_analytics: "Price trend analytics",
  geographic_comparison: "Geographic comparison",
  smart_alerts: "Smart alerts",
  simple_reports: "Simple reports",
  arbitrage_detection: "Arbitrage detection",
  multi_market_comparison: "Multi-market comparison",
  volatility_risk_analysis: "Volatility and risk analysis",
  bulk_export: "Bulk export",
  coverage_gap_visualization: "Coverage gap visualization",
  state_level_analytics: "State-level analytics",
  price_anomaly_detection: "Price anomaly detection",
  predictive_insights: "Predictive insights",
  policy_reports: "Policy reports",
  api_access: "Controlled API access",
  bulk_historical_data_access: "Bulk historical data access",
  data_visualization_tools: "Data visualization tools",
  data_quality_indicators: "Data quality indicators",
};
