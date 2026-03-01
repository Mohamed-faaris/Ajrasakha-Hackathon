import { z } from "zod";
import { MongoClient, Db, Collection } from "mongodb";

export const PriceSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().optional(),
});

export const PriceSchema = z.object({
  id: z.string(),
  cropId: z.string(),
  cropName: z.string(),
  mandiId: z.string(),
  mandiName: z.string(),
  stateId: z.string(),
  stateName: z.string(),
  date: z.string(),
  minPrice: z.number(),
  maxPrice: z.number(),
  modalPrice: z.number(),
  unit: z.string(),
  arrival: z.number().optional(),
  source: PriceSourceSchema.optional(),
});

export type Price = z.infer<typeof PriceSchema>;

interface CropMapEntry {
  id: string;
  name: string;
  commodityGroup: string;
  sourceId?: number;
}

interface LoaderConfig {
  mongoUri: string;
  dbName: string;
}

interface CropMapping {
  [key: string]: CropMapEntry;
}

interface AgmarknetMapping {
  [key: string]: string;
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseArgs(): { 
  date: string; 
  source: string; 
  skipScrape: boolean;
  mapperPath: string;
} {
  const args = process.argv.slice(2);
  const params = { 
    date: getTodayDate(), 
    source: "all",
    skipScrape: false,
    mapperPath: "../mapper/crop-map",
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--date":
      case "-d":
        params.date = args[++i];
        break;
      case "--source":
      case "-s":
        params.source = args[++i].toLowerCase();
        break;
      case "--skip-scrape":
      case "-skip":
        params.skipScrape = true;
        break;
      case "--mapper-path":
        params.mapperPath = args[++i];
        break;
      case "--help":
      case "-h":
        console.log(`
Price Loader
Loads price data from parser output and saves to MongoDB.

Usage:
  bun run loader/index.ts [options]

Options:
  --date, -d        Date in YYYY-MM-DD format [default: today]
  --source, -s      Source: msamb, krishimaratavahini, agmarknet, all [default: all]
  --skip-scrape    Skip scraping, use existing data only
  --mapper-path    Path to mapper directory [default: ./mapper/crop-map]
  -h, --help       Show this help

Examples:
  bun run loader/index.ts -d 2026-02-28 -s all
  bun run loader/index.ts -d 2026-02-28 -s msamb --skip-scrape
        `);
        process.exit(0);
    }
  }
  return params;
}

async function loadMapperData(mapperPath: string): Promise<{ crops: CropMapping; agmarknet: AgmarknetMapping }> {
  const [indexPath, agmarknetPath] = [
    `${mapperPath}/index.json`,
    `${mapperPath}/agmarknet.json`,
  ];

  const [indexFile, agmarknetFile] = await Promise.all([
    Bun.file(indexPath).text(),
    Bun.file(agmarknetPath).text(),
  ]);

  return {
    crops: JSON.parse(indexFile),
    agmarknet: JSON.parse(agmarknetFile),
  };
}

function normalizeCropName(cropName: string, agmarknetMap: AgmarknetMapping, cropIndex: CropMapping): {
  normalizedId: string;
  normalizedName: string;
} {
  if (!cropName) {
    return { normalizedId: "unknown", normalizedName: "Unknown" };
  }

  const upperCrop = cropName.toUpperCase().trim();
  const agmarknetKey = agmarknetMap[upperCrop];
  
  if (agmarknetKey && cropIndex[agmarknetKey]) {
    const entry = cropIndex[agmarknetKey];
    return { normalizedId: entry.id, normalizedName: entry.name };
  }

  const lowerCrop = cropName.toLowerCase().trim();
  if (cropIndex[lowerCrop]) {
    const entry = cropIndex[lowerCrop];
    return { normalizedId: entry.id, normalizedName: entry.name };
  }

  for (const [key, entry] of Object.entries(cropIndex)) {
    if (entry.name.toLowerCase() === lowerCrop) {
      return { normalizedId: entry.id, normalizedName: entry.name };
    }
  }

  return { normalizedId: lowerCrop.replace(/\s+/g, "-"), normalizedName: cropName };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function parsePrice(value: unknown): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseArrival(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (!value) return undefined;
  const cleaned = String(value).replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

interface RawPriceRecord {
  cropName: string;
  mandiName: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  arrival?: number;
  source?: string;
}

function transformToPrice(record: RawPriceRecord, sourceId: string, agmarknetMap: AgmarknetMapping, cropIndex: CropMapping): Price {
  const { normalizedId, normalizedName } = normalizeCropName(record.cropName, agmarknetMap, cropIndex);
  
  const stateInfo = extractStateInfo(record.mandiName);

  return {
    id: generateId(),
    cropId: normalizedId,
    cropName: normalizedName,
    mandiId: record.mandiName.toLowerCase().replace(/\s+/g, "-"),
    mandiName: record.mandiName,
    stateId: stateInfo.stateId,
    stateName: stateInfo.stateName,
    date: record.date,
    minPrice: parsePrice(record.minPrice),
    maxPrice: parsePrice(record.maxPrice),
    modalPrice: parsePrice(record.modalPrice),
    unit: record.unit || "Rs/Quintal",
    arrival: parseArrival(record.arrival),
    source: {
      id: sourceId,
      name: sourceId,
    },
  };
}

function extractStateInfo(mandiName: string): { stateId: string; stateName: string } {
  const commonStates: Record<string, string> = {
    maharashtra: "Maharashtra",
    karnataka: "Karnataka",
    tamil: "Tamil Nadu",
    andhra: "Andhra Pradesh",
    telangana: "Telangana",
    gujarat: "Gujarat",
    rajasthan: "Rajasthan",
    madhya: "Madhya Pradesh",
    uttar: "Uttar Pradesh",
    west: "West Bengal",
    punjab: "Punjab",
    haryana: "Haryana",
  };

  const lowerMandi = mandiName.toLowerCase();
  
  for (const [key, stateName] of Object.entries(commonStates)) {
    if (lowerMandi.includes(key)) {
      return {
        stateId: stateName.toLowerCase().replace(/\s+/g, "-"),
        stateName: stateName,
      };
    }
  }

  return { stateId: "unknown", stateName: "Unknown" };
}

async function checkDataExists(source: string, date: string): Promise<boolean> {
  const dataPath = `../parser/data/${source}/${date}.json`;
  const file = Bun.file(dataPath);
  const exists = await file.exists();
  return exists;
}

async function loadDataFile(source: string, date: string): Promise<RawPriceRecord[]> {
  const dataPath = `../parser/data/${source}/${date}.json`;
  const file = Bun.file(dataPath);
  
  if (!(await file.exists())) {
    throw new Error(`Data file not found: ${dataPath}`);
  }
  
  const content = await file.text();
  const data = JSON.parse(content);
  
  if (!Array.isArray(data)) {
    throw new Error(`Invalid data format in ${dataPath}`);
  }
  
  return data;
}

async function runParser(source: string, date: string): Promise<void> {
  console.log(`Running parser for ${source} on ${date}...`);
  
  const parserMap: Record<string, string> = {
    msamb: "scripts/msamb/index.ts",
    krishimaratavahini: "scripts/krishimaratavahini/index.ts",
    agmarknet: "scripts/agmarknet/index.ts",
  };

  const parserPath = parserMap[source];
  if (!parserPath) {
    throw new Error(`Unknown source: ${source}`);
  }

  const proc = Bun.spawn(["bun", "run", parserPath, "-d", date], {
    cwd: "./parser",
  });
  
  const exitCode = await proc.exited;
  
  if (exitCode !== 0) {
    throw new Error(`Parser ${source} failed with exit code ${exitCode}`);
  }
  
  console.log(`Parser ${source} completed successfully`);
}

async function connectMongoDB(config: LoaderConfig): Promise<{ client: MongoClient; db: Db }> {
  const client = new MongoClient(config.mongoUri);
  await client.connect();
  
  const db = client.db(config.dbName);
  
  await db.command({ ping: 1 });
  console.log(`Connected to MongoDB: ${config.dbName}`);
  
  return { client, db };
}

async function ensureIndexes(db: Db): Promise<void> {
  const prices = db.collection("prices");
  
  await prices.createIndex([["date", -1]]);
  await prices.createIndex([["cropName", 1], ["mandiName", 1], ["date", -1]]);
  await prices.createIndex([["stateName", 1]]);
  await prices.createIndex([["source.id", 1]]);
  
  await db.collection("crops").createIndex([["name", 1]], { unique: true });
  await db.collection("states").createIndex([["name", 1]], { unique: true });
  await db.collection("mandis").createIndex([["name", 1], ["stateName", 1]], { unique: true });
  
  console.log("Indexes ensured");
}

async function insertPrices(db: Db, prices: Price[]): Promise<number> {
  if (prices.length === 0) return 0;
  
  const pricesCollection = db.collection<Price>("prices");
  const now = new Date();
  
  const docs = prices.map(p => ({
    ...p,
    createdAt: now,
    updatedAt: now,
  }));
  
  try {
    const result = await pricesCollection.insertMany(docs, { ordered: false });
    return result.insertedCount;
  } catch (error: unknown) {
    if (error && typeof error === "object" && "writeErrors" in error) {
      const writeErrors = (error as { writeErrors?: { errmsg?: string }[] }).writeErrors;
      if (writeErrors) {
        return prices.length - writeErrors.length;
      }
    }
    throw error;
  }
}

async function upsertEntities(db: Db, prices: Price[]): Promise<{ crops: number; states: number; mandis: number }> {
  const crops = new Map<string, { name: string; commodityGroup: string }>();
  const states = new Map<string, { name: string; code: string }>();
  const mandis = new Map<string, { name: string; stateName: string }>();
  
  for (const p of prices) {
    if (p.cropName && !crops.has(p.cropName)) {
      crops.set(p.cropName, { name: p.cropName, commodityGroup: "" });
    }
    if (p.stateName && !states.has(p.stateName)) {
      states.set(p.stateName, { name: p.stateName, code: p.stateId });
    }
    const mandisKey = `${p.mandiName}-${p.stateName}`;
    if (!mandis.has(mandisKey)) {
      mandis.set(mandisKey, { name: p.mandiName, stateName: p.stateName });
    }
  }

  const now = new Date();
  let cropsCount = 0, statesCount = 0, mandisCount = 0;
  
  const cropsColl = db.collection("crops");
  for (const [, data] of crops) {
    const result = await cropsColl.updateOne(
      { name: data.name },
      { $set: { ...data, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    if (result.upsertedId) cropsCount++;
  }

  const statesColl = db.collection("states");
  for (const [, data] of states) {
    const result = await statesColl.updateOne(
      { name: data.name },
      { $set: { ...data, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    if (result.upsertedId) statesCount++;
  }

  const mandisColl = db.collection("mandis");
  for (const [, data] of mandis) {
    const result = await mandisColl.updateOne(
      { name: data.name, stateName: data.stateName },
      { $set: { ...data, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    if (result.upsertedId) mandisCount++;
  }

  return { crops: cropsCount, states: statesCount, mandis: mandisCount };
}

async function processSource(
  db: Db,
  source: string,
  date: string,
  skipScrape: boolean,
  agmarknetMap: AgmarknetMapping,
  cropIndex: CropMapping
): Promise<number> {
  const dataExists = await checkDataExists(source, date);
  
  if (!dataExists) {
    if (skipScrape) {
      console.log(`No data for ${source} on ${date}, skipping (--skip-scrape set)`);
      return 0;
    }
    await runParser(source, date);
  }
  
  const rawData = await loadDataFile(source, date);
  console.log(`Loaded ${rawData.length} raw records from ${source}`);
  
  const prices = rawData.map(record => 
    transformToPrice(record, source, agmarknetMap, cropIndex)
  );
  
  const validatedPrices = prices.map(p => PriceSchema.parse(p));
  console.log(`Validated ${validatedPrices.length} price records`);
  
  const inserted = await insertPrices(db, validatedPrices);
  console.log(`Inserted ${inserted} prices to MongoDB`);
  
  const entityCounts = await upsertEntities(db, validatedPrices);
  console.log(`Upserted entities: ${entityCounts.crops} crops, ${entityCounts.states} states, ${entityCounts.mandis} mandis`);
  
  return inserted;
}

async function main() {
  const args = parseArgs();
  
  const envPath = ".env";
  const envFile = Bun.file(envPath);
  
  if (!await envFile.exists()) {
    throw new Error(`.env file not found at ${envPath}. Please create it with MONGO_URI and DB_NAME.`);
  }
  
  const envContent = await envFile.text();
  let mongoUri = "";
  let dbName = "";
  
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^(\w+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      if (key === "MONGO_URI") mongoUri = value.trim();
      if (key === "DB_NAME") dbName = value.trim();
    }
  }
  
  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in .env file");
  }
  if (!dbName) {
    throw new Error("DB_NAME is missing in .env file");
  }
  
  console.log(`Loading price data for date: ${args.date}`);
  console.log(`Source: ${args.source}`);
  console.log(`Skip scrape: ${args.skipScrape}`);
  
  const { crops, agmarknet } = await loadMapperData(args.mapperPath);
  console.log(`Loaded mapper: ${Object.keys(crops).length} crops, ${Object.keys(agmarknet).length} agmarknet mappings`);
  
  const { client, db } = await connectMongoDB({ mongoUri, dbName });
  
  try {
    await ensureIndexes(db);
    
    const sources = args.source === "all" 
      ? ["msamb", "krishimaratavahini", "agmarknet"]
      : [args.source];
    
    let totalInserted = 0;
    
    for (const source of sources) {
      console.log(`\n--- Processing ${source} ---`);
      const inserted = await processSource(db, source, args.date, args.skipScrape, agmarknet, crops);
      totalInserted += inserted;
    }
    
    console.log(`\n=== Total inserted: ${totalInserted} ===`);
    
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

main();
