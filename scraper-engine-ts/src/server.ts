import { createServer } from "node:http";
import { saveEnamSnapshot } from "./runtime/snapshot.js";
import { renderDashboardHtml } from "./ui/dashboard.js";
import { runLatest } from "./runner.js";
import { getRepoRoot } from "./utils.js";
import path from "node:path";

const defaultPort = 8787;
const runtimeDir = path.join(getRepoRoot(import.meta.url), "scraper-engine-ts", "data", "runtime");

async function refreshNow(): Promise<void> {
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
}

export async function startDashboardServer(port = defaultPort): Promise<ReturnType<typeof createServer>> {
  const server = createServer(async (req, res) => {
    const url = req.url ?? "/";

    if (url === "/api/stats") {
      try {
        const { loadEnamSnapshot } = await import("./runtime/snapshot.js");
        const snapshot = await loadEnamSnapshot();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(snapshot ?? {
          site: "enam",
          refreshedAt: "",
          sourceUrl: "https://enam.gov.in/web/",
          sourceDate: "",
          fetchedAt: "",
          rawCount: 0,
          mappedCount: 0,
          normalizedCount: 0,
          sample: [],
        }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      }
      return;
    }

    if (url === "/api/refresh" && req.method === "POST") {
      try {
        await refreshNow();
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
      }
      return;
    }

    if (url === "/") {
      const html = await renderDashboardHtml();
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      console.log(`scraper-engine-ts dashboard running at http://localhost:${port}`);
      resolve();
    });
  });

  return server;
}

if (import.meta.main) {
  const port = Number(process.env.PORT ?? defaultPort);
  void startDashboardServer(port);
}
