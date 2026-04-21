import path from "node:path";
import { getRepoRoot, readJsonFile } from "../utils.js";
import { mapEnamRecords } from "../sites/enam/map.js";
import { normalizeEnamRecords } from "../sites/enam/normalize.js";
import type { EnamRawRecord } from "../sites/enam/types.js";

export async function runEnamFixtureManualCheck(): Promise<{
  fixturePath: string;
  rawCount: number;
  mappedCount: number;
  normalizedCount: number;
  sample: ReturnType<typeof normalizeEnamRecords>;
}> {
  const fixturePath = path.join(getRepoRoot(import.meta.url), "tmp", "seed-scraper", "data-tmps", "crops", "enam.json");
  const payload = await readJsonFile<{ data: EnamRawRecord[] }>(fixturePath);
  const raw = payload.data ?? [];
  const mapped = mapEnamRecords(raw);
  const normalized = normalizeEnamRecords(mapped);

  return {
    fixturePath,
    rawCount: raw.length,
    mappedCount: mapped.length,
    normalizedCount: normalized.length,
    sample: normalized.slice(0, 5),
  };
}
