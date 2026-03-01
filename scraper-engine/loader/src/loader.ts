import { PATHS, SOURCES, STATE_CODE_MAP } from "./config.js";
import { loadMaps } from "./maps.js";
import { normalizeRecord } from "./normalize.js";
import { Database } from "./db.js";
import type { RawPriceRecord, PriceDocument, LoaderLogEntry, LoadedMaps, LoadStats } from "./types.js";

export class PriceLoader {
  private db: Database;
  private stats: LoadStats;
  private logs: LoaderLogEntry[];
  
  constructor() {
    this.db = new Database();
    this.stats = {
      processed: 0,
      inserted: 0,
      failed: 0,
      missingCrops: 0,
      missingMandis: 0,
    };
    this.logs = [];
  }
  
  async initialize(): Promise<void> {
    await this.db.connect();
  }
  
  async close(): Promise<void> {
    await this.db.disconnect();
  }
  
  async loadSource(source: string, date: string, dryRun: boolean, batchSize: number): Promise<LoadStats> {
    console.log(`\n=== Processing ${source} for ${date} ===`);
    
    // Load data file
    const records = await this.loadDataFile(source, date);
    if (records.length === 0) {
      console.log(`No records found for ${source} on ${date}`);
      return this.stats;
    }
    console.log(`Loaded ${records.length} raw records`);
    
    // Load maps
    const maps = await loadMaps(source);
    console.log(`Maps loaded: ${Object.keys(maps.cropMap).length} crops, ${Object.keys(maps.apmcMap).length} mandis`);
    
    // Process records
    const prices: PriceDocument[] = [];
    const entitySet = new Set<string>();
    
    for (const record of records) {
      this.stats.processed++;
      
      const result = normalizeRecord(record, source, maps);
      
      if (!result.success) {
        if (result.logEntry) {
          this.logs.push(result.logEntry);
          if (result.logEntry.type === "missing_crop") {
            this.stats.missingCrops++;
          } else {
            this.stats.missingMandis++;
          }
        }
        continue;
      }
      
      if (result.document) {
        prices.push(result.document);
        
        // Track entities to upsert
        entitySet.add(`crop:${result.document.cropId}:${result.document.cropName}`);
        entitySet.add(`state:${result.document.stateId}:${result.document.stateName}:${result.document.stateId.toUpperCase()}`);
        entitySet.add(`mandi:${result.document.mandiId}:${result.document.mandiName}:${result.document.stateId}:${result.document.stateName}:${result.document.districtId}:${result.document.districtName}`);
      }
    }
    
    console.log(`Normalized ${prices.length} records (${this.stats.missingCrops} missing crops, ${this.stats.missingMandis} missing mandis)`);
    
    if (dryRun) {
      console.log(`[DRY RUN] Would insert ${prices.length} prices, ${this.logs.length} logs`);
      return this.stats;
    }
    
    // Insert in batches
    let insertedCount = 0;
    for (let i = 0; i < prices.length; i += batchSize) {
      const batch = prices.slice(i, i + batchSize);
      const batchInserted = await this.db.insertPrices(batch);
      insertedCount += batchInserted;
      
      if (batchInserted < batch.length) {
        console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${batchInserted}/${batch.length} inserted (some may be duplicates)`);
      }
    }
    
    this.stats.inserted = insertedCount;
    console.log(`Inserted ${insertedCount} prices into database`);
    
    // Upsert entities
    await this.upsertEntities(entitySet);
    
    // Save loader logs
    if (this.logs.length > 0) {
      const logsInserted = await this.db.insertLoaderLogs(this.logs);
      console.log(`Logged ${logsInserted} missing mappings to loader_logs`);
    }
    
    return this.stats;
  }
  
  private async loadDataFile(source: string, date: string): Promise<RawPriceRecord[]> {
    const path = `${PATHS.parserData}/${source}/${date}.json`;
    
    try {
      const file = Bun.file(path);
      if (!(await file.exists())) {
        console.warn(`Data file not found: ${path}`);
        return [];
      }
      
      const content = await file.text();
      const data = JSON.parse(content);
      
      if (!Array.isArray(data)) {
        console.error(`Invalid data format in ${path}: expected array`);
        return [];
      }
      
      return data as RawPriceRecord[];
    } catch (error) {
      console.error(`Failed to load data from ${path}:`, error);
      return [];
    }
  }
  
  private async upsertEntities(entitySet: Set<string>): Promise<void> {
    const crops: Array<{ id: string; name: string }> = [];
    const states: Array<{ id: string; name: string; code: string }> = [];
    const mandis: Array<{ id: string; name: string; stateId: string; stateName: string; districtId: string; districtName: string }> = [];
    
    for (const entity of entitySet) {
      const parts = entity.split(":");
      const type = parts[0];
      
      if (type === "crop" && parts.length >= 3) {
        crops.push({ id: parts[1], name: parts[2] });
      } else if (type === "state" && parts.length >= 4) {
        states.push({ id: parts[1], name: parts[2], code: parts[3] });
      } else if (type === "mandi" && parts.length >= 8) {
        mandis.push({
          id: parts[1],
          name: parts[2],
          stateId: parts[3],
          stateName: parts[4],
          districtId: parts[5],
          districtName: parts[6],
        });
      }
    }
    
    // Upsert in parallel
    const promises: Promise<void>[] = [];
    
    for (const crop of crops) {
      promises.push(this.db.upsertCrop(crop.id, crop.name, ""));
    }
    
    for (const state of states) {
      promises.push(this.db.upsertState(state.id, state.name, state.code));
    }
    
    for (const mandi of mandis) {
      promises.push(this.db.upsertMandi(
        mandi.id,
        mandi.name,
        mandi.stateId,
        mandi.stateName,
        mandi.districtId,
        mandi.districtName
      ));
    }
    
    await Promise.all(promises);
    console.log(`Upserted ${crops.length} crops, ${states.length} states, ${mandis.length} mandis`);
  }
  
  getStats(): LoadStats {
    return { ...this.stats };
  }
}
