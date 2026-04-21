import path from "node:path";
import { getRepoRoot, readJsonFile } from "../../utils.js";
import type { SiteDefinition } from "../../types.js";
import type { EnamMappedRecord, EnamNormalizedRecord, EnamRawRecord } from "./types.js";
import { scrapeEnam } from "./scrape.js";
import { mapEnamRecords } from "./map.js";
import { normalizeEnamRecords } from "./normalize.js";

async function loadFixtureRecords(): Promise<EnamRawRecord[]> {
  const fixturePath = path.join(getRepoRoot(import.meta.url), "tmp", "seed-scraper", "data-tmps", "crops", "enam.json");
  const payload = await readJsonFile<{ data: EnamRawRecord[] }>(fixturePath);
  return payload.data ?? [];
}

export const enamSite: SiteDefinition<EnamRawRecord, EnamMappedRecord, EnamNormalizedRecord> = {
  name: "enam",
  label: "eNAM",
  entryUrl: "https://enam.gov.in/web/",
  scrape: (options) => scrapeEnam(options as Record<string, unknown>),
  map: mapEnamRecords,
  normalize: normalizeEnamRecords,
  loadFixture: loadFixtureRecords,
};
