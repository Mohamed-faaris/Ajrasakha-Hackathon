import path from "node:path";
import { runLatest, runMap, runNormalize, runScrape, runVerify, parseRunCommand } from "./runner.js";
import { getRepoRoot } from "./utils.js";
import { startDashboardServer } from "./server.js";
import { startCron } from "./cron.js";
import { inspectEnamWithAgent } from "./agent/pi-agent.js";

function usage(): void {
  console.log([
    "Usage:",
    "  bun run src/cli.ts latest enam [--date YYYY-MM-DD] [--out DIR]",
    "  bun run src/cli.ts scrape enam [--date YYYY-MM-DD] [--out DIR]",
    "  bun run src/cli.ts map enam --input FILE [--out DIR]",
    "  bun run src/cli.ts normalize enam --input FILE [--out DIR]",
    "  bun run src/cli.ts verify enam [--out DIR]",
    "  bun run src/cli.ts inspect enam [--role inspector|server|NAME]",
    "  bun run src/cli.ts server [--port PORT]",
    "  bun run src/cli.ts cron",
  ].join("\n"));
}

function getFlag(args: string[], name: string): string {
  const idx = args.indexOf(name);
  if (idx === -1 || idx === args.length - 1) {
    return "";
  }
  return args[idx + 1] ?? "";
}

async function main(): Promise<void> {
  const [commandRaw, maybeSiteName, ...rest] = process.argv.slice(2);

  if (!commandRaw) {
    usage();
    process.exitCode = 1;
    return;
  }

  const command = parseRunCommand(commandRaw);
  const date = getFlag(rest, "--date") || undefined;
  const input = getFlag(rest, "--input") || undefined;
  const role = getFlag(rest, "--role") || "inspector";
  const outputDirFlag = getFlag(rest, "--out") || "";
  const outputDir = outputDirFlag || path.join(getRepoRoot(import.meta.url), "scraper-engine-ts", "data", "output");

  if (command === "server") {
    const port = Number(getFlag(rest, "--port") || process.env.PORT || 8787);
    await startDashboardServer(port);
    return;
  }

  if (command === "cron") {
    startCron();
    return;
  }

  if (!maybeSiteName) {
    usage();
    process.exitCode = 1;
    return;
  }

  const siteName = maybeSiteName;

  if (command === "latest") {
    const result = await runLatest(siteName, { date, outputDir });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "scrape") {
    const result = await runScrape(siteName, { date, outputDir });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "map") {
    if (!input) {
      throw new Error("--input is required for map");
    }
    const result = await runMap(siteName, input, { outputDir });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "normalize") {
    if (!input) {
      throw new Error("--input is required for normalize");
    }
    const result = await runNormalize(siteName, input, { outputDir });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "verify") {
    const result = await runVerify(siteName, { outputDir });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "inspect") {
    if (siteName !== "enam") {
      throw new Error(`Inspect is only wired for enam right now: ${siteName}`);
    }
    const result = await inspectEnamWithAgent({ role });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  usage();
}

main().catch(async (error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
