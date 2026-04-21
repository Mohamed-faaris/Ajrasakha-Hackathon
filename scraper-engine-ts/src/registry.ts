import { enamSite } from "./sites/index.js";
import type { SiteDefinition, SiteName } from "./types.js";
import type { EnamMappedRecord, EnamNormalizedRecord, EnamRawRecord } from "./sites/enam/types.js";

type AnySite = SiteDefinition<EnamRawRecord, EnamMappedRecord, EnamNormalizedRecord>;

const registry = new Map<SiteName, AnySite>([[enamSite.name, enamSite]]);

export function listSites(): AnySite[] {
  return [...registry.values()];
}

export function getSite(name: string): AnySite {
  const site = registry.get(name as SiteName);
  if (!site) {
    throw new Error(`Unknown site: ${name}`);
  }

  return site;
}
