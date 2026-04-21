import cron from "node-cron";
import path from "node:path";
import { runLatest } from "./runner.js";
import { saveEnamSnapshot } from "./runtime/snapshot.js";
import { getRepoRoot } from "./utils.js";

const runtimeDir = path.join(getRepoRoot(import.meta.url), "scraper-engine-ts", "data", "runtime");

async function refreshEnam(): Promise<void> {
  const latest = await runLatest("enam", { outputDir: runtimeDir });
  await saveEnamSnapshot({
    site: "enam",
    refreshedAt: new Date().toISOString(),
    sourceUrl: latest.sourceUrl,
    sourceDate: latest.sourceDate,
    fetchedAt: latest.fetchedAt,
    rawCount: latest.raw.length,
    mappedCount: latest.mapped.length,
    normalizedCount: latest.normalized.length,
    sample: latest.normalized.slice(0, 5),
  });
  console.log(`[Cron] ENAM refreshed: ${latest.normalized.length} normalized rows`);
}

export function startCron(): void {
  void refreshEnam();

  cron.schedule("0 */6 * * *", async () => {
    try {
      await refreshEnam();
    } catch (error) {
      console.error("[Cron] ENAM refresh failed:", error);
    }
  }, {
    timezone: "Asia/Kolkata",
  });

  console.log("[Cron] ENAM refresh scheduled every 6 hours");
}

if (import.meta.main) {
  startCron();
}
