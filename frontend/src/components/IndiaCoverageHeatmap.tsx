import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { StateCoverage } from "@/lib/types";

interface IndiaCoverageHeatmapProps {
  coverageData: StateCoverage[];
  onStateClick?: (stateName: string) => void;
}

interface GeoFeature {
  type: "Feature";
  properties?: Record<string, unknown>;
  geometry?: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

interface GeoCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

interface PathFeature {
  name: string;
  path: string;
}

interface TooltipState {
  x: number;
  y: number;
  featureName: string;
}

const INDIA_STATES_GEOJSON_URL =
  "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States";

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 900;
const VIEWBOX_PADDING = 24;

const COLORS = {
  below60: "#ef4444",
  from60to74: "#facc15",
  from75to89: "#86efac",
  from90: "#166534",
  noData: "#9ca3af",
  stroke: "#ffffff",
  hoverStroke: "#111827",
};

const normalizeState = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");

const STATE_ALIASES: Record<string, string> = {
  orissa: "odisha",
  uttaranchal: "uttarakhand",
  pondicherry: "puducherry",
  nctofdelhi: "delhi",
  andamanandnicobar: "andamanandnicobarislands",
  jammuandkashmir: "jammuandkashmir",
};

const resolveCoverage = (stateName: string, byState: Map<string, StateCoverage>) => {
  const normalized = normalizeState(stateName);
  const canonical = STATE_ALIASES[normalized] ?? normalized;
  return byState.get(canonical) ?? null;
};

const getCoveragePercent = (entry: StateCoverage | null) => {
  if (!entry || !entry.totalApmcs) return null;
  return ((entry.enamIntegrated + entry.statePortal) / entry.totalApmcs) * 100;
};

const getCoverageColor = (pct: number | null) => {
  if (pct === null) return COLORS.noData;
  if (pct < 60) return COLORS.below60;
  if (pct < 75) return COLORS.from60to74;
  if (pct < 90) return COLORS.from75to89;
  return COLORS.from90;
};

const getFeatureName = (feature: GeoFeature) => {
  const props = feature.properties ?? {};
  const raw =
    props.NAME_1 ??
    props.ST_NM ??
    props.State_Name ??
    props.state ??
    props.name ??
    "Unknown";
  return String(raw);
};

const buildPath = (rings: number[][][], scaleX: (x: number) => number, scaleY: (y: number) => number) =>
  rings
    .map((ring) =>
      ring
        .map(([lon, lat], index) => {
          const x = scaleX(lon);
          const y = scaleY(-lat);
          return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ")
    )
    .map((segment) => `${segment} Z`)
    .join(" ");

const extractAllPoints = (features: GeoFeature[]) => {
  const points: Array<[number, number]> = [];
  for (const feature of features) {
    if (!feature.geometry) continue;
    if (feature.geometry.type === "Polygon") {
      for (const ring of feature.geometry.coordinates as number[][][]) {
        for (const [lon, lat] of ring) points.push([lon, -lat]);
      }
      continue;
    }
    for (const polygon of feature.geometry.coordinates as number[][][][]) {
      for (const ring of polygon) {
        for (const [lon, lat] of ring) points.push([lon, -lat]);
      }
    }
  }
  return points;
};

const buildPathFeatures = (collection: GeoCollection): PathFeature[] => {
  const points = extractAllPoints(collection.features);
  if (points.length === 0) return [];

  const minX = Math.min(...points.map(([x]) => x));
  const maxX = Math.max(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));
  const maxY = Math.max(...points.map(([, y]) => y));

  const contentWidth = VIEWBOX_WIDTH - VIEWBOX_PADDING * 2;
  const contentHeight = VIEWBOX_HEIGHT - VIEWBOX_PADDING * 2;
  const scale = Math.min(contentWidth / (maxX - minX), contentHeight / (maxY - minY));

  const projectedWidth = (maxX - minX) * scale;
  const projectedHeight = (maxY - minY) * scale;
  const offsetX = (VIEWBOX_WIDTH - projectedWidth) / 2;
  const offsetY = (VIEWBOX_HEIGHT - projectedHeight) / 2;

  const scaleX = (x: number) => offsetX + (x - minX) * scale;
  const scaleY = (y: number) => offsetY + (y - minY) * scale;

  return collection.features
    .filter((feature) => feature.geometry)
    .map((feature) => {
      const name = getFeatureName(feature);
      const geometry = feature.geometry!;
      if (geometry.type === "Polygon") {
        return {
          name,
          path: buildPath(geometry.coordinates as number[][][], scaleX, scaleY),
        };
      }
      const polygons = geometry.coordinates as number[][][][];
      const path = polygons.map((rings) => buildPath(rings, scaleX, scaleY)).join(" ");
      return { name, path };
    });
};

export const IndiaCoverageHeatmap = ({ coverageData, onStateClick }: IndiaCoverageHeatmapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [features, setFeatures] = useState<PathFeature[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const coverageByState = useMemo(() => {
    const map = new Map<string, StateCoverage>();
    for (const entry of coverageData) {
      map.set(normalizeState(entry.state), entry);
      map.set(normalizeState(entry.stateCode), entry);
    }
    return map;
  }, [coverageData]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch(INDIA_STATES_GEOJSON_URL, { signal: controller.signal });
        if (!response.ok) throw new Error(`Map data request failed (${response.status})`);
        const json = (await response.json()) as GeoCollection;
        if (!mounted) return;
        setFeatures(buildPathFeatures(json));
        setLoadError(null);
      } catch (error) {
        if (!mounted || controller.signal.aborted) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load map");
      }
    };

    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const hoveredCoverage = tooltip ? resolveCoverage(tooltip.featureName, coverageByState) : null;
  const hoveredPct = getCoveragePercent(hoveredCoverage);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border bg-card/60 p-2 sm:p-3"
      >
        {loadError ? (
          <div className="text-sm text-destructive px-3 py-8 text-center">
            Unable to load India map data. {loadError}
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className="w-full h-auto"
            role="img"
            aria-label="India state coverage heatmap"
          >
            {features.map((feature) => {
              const coverage = resolveCoverage(feature.name, coverageByState);
              const pct = getCoveragePercent(coverage);
              const isHovered = hoveredState === feature.name;
              return (
                <path
                  key={feature.name}
                  d={feature.path}
                  fill={getCoverageColor(pct)}
                  stroke={isHovered ? COLORS.hoverStroke : COLORS.stroke}
                  strokeWidth={isHovered ? 1.8 : 1}
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer transition-[fill,stroke,stroke-width] duration-200 ease-out"
                  onMouseEnter={() => setHoveredState(feature.name)}
                  onMouseLeave={() => {
                    setHoveredState(null);
                    setTooltip(null);
                  }}
                  onMouseMove={(event: ReactMouseEvent<SVGPathElement>) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    setTooltip({
                      featureName: feature.name,
                      x: event.clientX - rect.left + 10,
                      y: event.clientY - rect.top + 10,
                    });
                  }}
                  onClick={() => onStateClick?.(feature.name)}
                />
              );
            })}
          </svg>
        )}

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 min-w-[170px] rounded-md border bg-background/95 px-3 py-2 text-xs shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <p className="font-semibold text-foreground">{tooltip.featureName}</p>
            <p className="text-muted-foreground mt-1">
              Coverage: {hoveredPct === null ? "No data" : `${hoveredPct.toFixed(1)}%`}
            </p>
            <p className="text-muted-foreground">Total APMCs: {hoveredCoverage?.totalApmcs ?? "-"}</p>
            <p className="text-muted-foreground">eNAM: {hoveredCoverage?.enamIntegrated ?? "-"}</p>
            <p className="text-muted-foreground">Portal: {hoveredCoverage?.statePortal ?? "-"}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border" style={{ backgroundColor: COLORS.below60 }} />
          Below 60%
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border" style={{ backgroundColor: COLORS.from60to74 }} />
          60-74%
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border" style={{ backgroundColor: COLORS.from75to89 }} />
          75-89%
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border" style={{ backgroundColor: COLORS.from90 }} />
          90% and above
        </div>
        <div className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm border" style={{ backgroundColor: COLORS.noData }} />
          No data
        </div>
      </div>
    </div>
  );
};
