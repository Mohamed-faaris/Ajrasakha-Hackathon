import path from "node:path";
import { getSite } from "./registry.js";
import { buildOutputDir, writeJsonFile } from "./utils.js";
import type { LatestRunOutput, RunCommand } from "./types.js";
import type { EnamMappedRecord, EnamNormalizedRecord, EnamRawRecord } from "./sites/enam/types.js";
import { readJsonFile } from "./utils.js";

export interface RunOptions {
  date?: string;
  input?: string;
  outputDir?: string;
}

function unwrapRecords<T>(payload: { data?: T[]; records?: T[] } | T[]): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.data ?? payload.records ?? [];
}

export async function runLatest(siteName: string, options: RunOptions = {}): Promise<LatestRunOutput<EnamRawRecord, EnamMappedRecord, EnamNormalizedRecord>> {
  const site = getSite(siteName);
  const scrapeResult = await site.scrape({ date: options.date });
  const mapped = site.map(scrapeResult.records);
  const normalized = site.normalize(mapped);

  if (options.outputDir) {
    const outDir = buildOutputDir(options.outputDir, siteName, "latest");
    await writeJsonFile(path.join(outDir, "raw.json"), {
      data: scrapeResult.records,
      meta: scrapeResult.meta,
      sourceUrl: scrapeResult.sourceUrl,
      sourceDate: scrapeResult.sourceDate,
      fetchedAt: scrapeResult.fetchedAt,
    });
    await writeJsonFile(path.join(outDir, "mapped.json"), {
      data: mapped,
      meta: scrapeResult.meta,
      sourceUrl: scrapeResult.sourceUrl,
      sourceDate: scrapeResult.sourceDate,
      fetchedAt: scrapeResult.fetchedAt,
    });
    await writeJsonFile(path.join(outDir, "normalized.json"), {
      data: normalized,
      meta: scrapeResult.meta,
      sourceUrl: scrapeResult.sourceUrl,
      sourceDate: scrapeResult.sourceDate,
      fetchedAt: scrapeResult.fetchedAt,
    });
  }

  return {
    site: scrapeResult.site,
    sourceUrl: scrapeResult.sourceUrl,
    sourceDate: scrapeResult.sourceDate,
    fetchedAt: scrapeResult.fetchedAt,
    raw: scrapeResult.records,
    mapped,
    normalized,
  };
}

export async function runScrape(siteName: string, options: RunOptions = {}): Promise<EnamRawRecord[]> {
  const site = getSite(siteName);
  const result = await site.scrape({ date: options.date });

  if (options.outputDir) {
    const outDir = buildOutputDir(options.outputDir, siteName, "scrape");
    await writeJsonFile(path.join(outDir, "raw.json"), {
      data: result.records,
      meta: result.meta,
      sourceUrl: result.sourceUrl,
      sourceDate: result.sourceDate,
      fetchedAt: result.fetchedAt,
    });
  }

  return result.records;
}

export async function runMap(siteName: string, inputPath: string, options: RunOptions = {}): Promise<EnamMappedRecord[]> {
  const site = getSite(siteName);
  const payload = await readJsonFile<{ data?: EnamRawRecord[]; records?: EnamRawRecord[] }>(inputPath);
  const records = unwrapRecords(payload);
  const mapped = site.map(records);

  if (options.outputDir) {
    const outDir = buildOutputDir(options.outputDir, siteName, "map");
    await writeJsonFile(path.join(outDir, "mapped.json"), {
      data: mapped,
      source: siteName,
      inputPath,
    });
  }

  return mapped;
}

export async function runNormalize(siteName: string, inputPath: string, options: RunOptions = {}): Promise<EnamNormalizedRecord[]> {
  const site = getSite(siteName);
  const payload = await readJsonFile<{ data?: EnamMappedRecord[]; records?: EnamMappedRecord[] } | EnamMappedRecord[]>(inputPath);
  const records = unwrapRecords(payload);
  const normalized = site.normalize(records);

  if (options.outputDir) {
    const outDir = buildOutputDir(options.outputDir, siteName, "normalize");
    await writeJsonFile(path.join(outDir, "normalized.json"), {
      data: normalized,
      source: siteName,
      inputPath,
    });
  }

  return normalized;
}

export async function runVerify(siteName: string, options: RunOptions = {}): Promise<{
  rawCount: number;
  mappedCount: number;
  normalizedCount: number;
  sample: EnamNormalizedRecord[];
}> {
  const site = getSite(siteName);
  const fixtureRecords = site.loadFixture ? await site.loadFixture() : [];
  const mapped = site.map(fixtureRecords);
  const normalized = site.normalize(mapped);
  const sample = normalized.slice(0, 5);

  if (options.outputDir) {
    const outDir = buildOutputDir(options.outputDir, siteName, "verify");
    await writeJsonFile(path.join(outDir, "fixture-raw.json"), { data: fixtureRecords });
    await writeJsonFile(path.join(outDir, "fixture-mapped.json"), { data: mapped });
    await writeJsonFile(path.join(outDir, "fixture-normalized.json"), { data: normalized });
  }

  return {
    rawCount: fixtureRecords.length,
    mappedCount: mapped.length,
    normalizedCount: normalized.length,
    sample,
  };
}

export async function runInspect(siteName: string): Promise<unknown> {
  if (siteName !== "enam") {
    throw new Error(`Inspect is only wired for enam right now: ${siteName}`);
  }

  const { inspectEnamWithAgent } = await import("./agent/pi-agent.js");
  return inspectEnamWithAgent();
}

export function parseRunCommand(value: string): RunCommand {
  const allowed: RunCommand[] = ["latest", "scrape", "map", "normalize", "verify", "inspect", "server", "cron"];
  if (!allowed.includes(value as RunCommand)) {
    throw new Error(`Unknown command: ${value}`);
  }

  return value as RunCommand;
}
