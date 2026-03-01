#!/usr/bin/env bun
import { readdir } from "fs/promises";
import { join } from "path";
import { PriceLoader } from "./loader.js";
import { SOURCES, PATHS } from "./config.js";
import type { LoadStats } from "./types.js";

async function getAvailableDates(source: string): Promise<string[]> {
  const path = `${PATHS.parserData}/${source}`;
  const dates: string[] = [];
  
  try {
    const entries = await readdir(path, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const date = entry.name.replace('.json', '');
        dates.push(date);
      }
    }
  } catch {
    // Directory might not exist
  }
  
  return dates.sort();
}

async function main() {
  console.log("=".repeat(60));
  console.log("BULK DATA LOADER");
  console.log("=".repeat(60));
  
  const loader = new PriceLoader();
  await loader.initialize();
  
  const grandTotal: LoadStats = {
    processed: 0,
    inserted: 0,
    failed: 0,
    missingCrops: 0,
    missingMandis: 0,
  };
  
  try {
    for (const source of SOURCES) {
      const dates = await getAvailableDates(source);
      
      if (dates.length === 0) {
        console.log(`\nNo data files found for ${source}`);
        continue;
      }
      
      console.log(`\n${"=".repeat(60)}`);
      console.log(`Processing ${source}: ${dates.length} date(s)`);
      console.log("=".repeat(60));
      
      for (const date of dates) {
        try {
          const stats = await loader.loadSource(source, date, false, 1000);
          grandTotal.processed += stats.processed;
          grandTotal.inserted += stats.inserted;
          grandTotal.failed += stats.failed;
          grandTotal.missingCrops += stats.missingCrops;
          grandTotal.missingMandis += stats.missingMandis;
          
          // Small delay between batches to not overwhelm DB
          await new Promise(r => setTimeout(r, 100));
        } catch (error) {
          console.error(`Error loading ${source} ${date}:`, error);
        }
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("GRAND TOTAL");
    console.log("=".repeat(60));
    console.log(`Total Processed: ${grandTotal.processed}`);
    console.log(`Total Inserted: ${grandTotal.inserted}`);
    console.log(`Missing Crops: ${grandTotal.missingCrops}`);
    console.log(`Missing Mandis: ${grandTotal.missingMandis}`);
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await loader.close();
  }
}

main();
