#!/usr/bin/env bun
import { parseArgs, SOURCES } from "./config.js";
import { PriceLoader } from "./loader.js";
import type { LoadStats } from "./types.js";

async function main() {
  const args = parseArgs();
  
  console.log("=".repeat(60));
  console.log("Price Loader v2.0");
  console.log("=".repeat(60));
  console.log(`Date: ${args.date}`);
  console.log(`Source: ${args.source}`);
  console.log(`Dry Run: ${args.dryRun}`);
  console.log(`Batch Size: ${args.batchSize}`);
  console.log("=".repeat(60));
  
  const loader = new PriceLoader();
  
  try {
    await loader.initialize();
    
    const sources = args.source === "all" ? SOURCES : [args.source];
    const totalStats: LoadStats = {
      processed: 0,
      inserted: 0,
      failed: 0,
      missingCrops: 0,
      missingMandis: 0,
    };
    
    for (const source of sources) {
      const stats = await loader.loadSource(source, args.date, args.dryRun, args.batchSize);
      totalStats.processed += stats.processed;
      totalStats.inserted += stats.inserted;
      totalStats.failed += stats.failed;
      totalStats.missingCrops += stats.missingCrops;
      totalStats.missingMandis += stats.missingMandis;
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("FINAL SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Processed: ${totalStats.processed}`);
    console.log(`Total Inserted: ${totalStats.inserted}`);
    console.log(`Missing Crops: ${totalStats.missingCrops}`);
    console.log(`Missing Mandis: ${totalStats.missingMandis}`);
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await loader.close();
  }
}

main();
