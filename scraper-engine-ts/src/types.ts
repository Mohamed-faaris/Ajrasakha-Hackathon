export type SiteName = "enam";

export type RunCommand = "latest" | "scrape" | "map" | "normalize" | "verify" | "inspect" | "server" | "cron";

export type InspectRole = "inspector" | "server" | (string & {});

export interface ScrapeResult<TRaw extends object> {
  site: SiteName;
  sourceUrl: string;
  fetchedAt: string;
  sourceDate: string;
  records: TRaw[];
  meta: Record<string, unknown>;
}

export interface SiteDefinition<TRaw extends object, TMapped extends object, TNormalized extends object> {
  name: SiteName;
  label: string;
  entryUrl: string;
  scrape: (options?: Record<string, unknown>) => Promise<ScrapeResult<TRaw>>;
  map: (records: TRaw[]) => TMapped[];
  normalize: (records: TMapped[]) => TNormalized[];
  loadFixture?: () => Promise<TRaw[]>;
}

export interface LatestRunOutput<TRaw, TMapped, TNormalized> {
  site: SiteName;
  sourceUrl: string;
  sourceDate: string;
  fetchedAt: string;
  raw: TRaw[];
  mapped: TMapped[];
  normalized: TNormalized[];
}
