import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getRepoRoot } from "../utils.js";

export interface EnamSnapshot {
  site: "enam";
  refreshedAt: string;
  sourceUrl: string;
  sourceDate: string;
  fetchedAt: string;
  rawCount: number;
  mappedCount: number;
  normalizedCount: number;
  sample: unknown[];
}

function getSnapshotPath(): string {
  return path.join(getRepoRoot(import.meta.url), "scraper-engine-ts", "data", "runtime", "enam-latest.json");
}

export async function saveEnamSnapshot(snapshot: EnamSnapshot): Promise<void> {
  const filePath = getSnapshotPath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}

export async function loadEnamSnapshot(): Promise<EnamSnapshot | null> {
  const filePath = getSnapshotPath();
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as EnamSnapshot;
  } catch {
    return null;
  }
}
