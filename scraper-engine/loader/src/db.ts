import { MongoClient, Db, Collection, AnyBulkWriteOperation } from "mongodb";
import { getMongoConfig } from "./config.js";
import type { PriceDocument, LoaderLogEntry } from "./types.js";

export class Database {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  
  async connect(): Promise<void> {
    const { mongoUri, dbName } = getMongoConfig();
    
    this.client = new MongoClient(mongoUri);
    await this.client.connect();
    this.db = this.client.db(dbName);
    
    // Verify connection
    await this.db.command({ ping: 1 });
    console.log(`Connected to MongoDB: ${dbName}`);
    
    // Ensure indexes
    await this.ensureIndexes();
  }
  
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      console.log("MongoDB connection closed");
    }
  }
  
  private async ensureIndexes(): Promise<void> {
    if (!this.db) throw new Error("Database not connected");
    
    const prices = this.db.collection("prices");
    const loaderLogs = this.db.collection("loader_logs");
    
    // Price indexes (matching server schema)
    await prices.createIndex({ date: -1 });
    await prices.createIndex({ mandiId: 1, date: -1 });
    await prices.createIndex({ cropId: 1, date: -1 });
    await prices.createIndex({ stateId: 1, cropId: 1, date: -1 });
    await prices.createIndex({ mandiId: 1, cropId: 1, date: -1 });
    await prices.createIndex({ source: 1, date: -1 });
    
    // Unique index to prevent duplicates
    await prices.createIndex(
      { source: 1, date: 1, cropId: 1, mandiId: 1 },
      { unique: true }
    );
    
    // Loader logs indexes
    await loaderLogs.createIndex({ type: 1, createdAt: -1 });
    await loaderLogs.createIndex({ source: 1, date: 1 });
    await loaderLogs.createIndex({ rawName: 1, type: 1 });
    
    console.log("Indexes ensured");
  }
  
  async insertPrices(prices: PriceDocument[]): Promise<number> {
    if (!this.db) throw new Error("Database not connected");
    if (prices.length === 0) return 0;
    
    const collection: Collection<PriceDocument> = this.db.collection("prices");
    
    try {
      const result = await collection.insertMany(prices, { ordered: false });
      return result.insertedCount;
    } catch (error: unknown) {
      // Handle duplicate key errors (partial success)
      if (error && typeof error === "object" && "writeErrors" in error) {
        const writeErrors = (error as { writeErrors?: Array<{ code?: number }> }).writeErrors;
        if (writeErrors) {
          const duplicateCount = writeErrors.filter(e => e.code === 11000).length;
          const otherErrors = writeErrors.filter(e => e.code !== 11000);
          
          if (otherErrors.length > 0) {
            console.warn(`Non-duplicate errors: ${otherErrors.length}`);
          }
          
          // Return count of successful inserts
          return prices.length - writeErrors.length;
        }
      }
      throw error;
    }
  }
  
  async insertLoaderLogs(logs: LoaderLogEntry[]): Promise<number> {
    if (!this.db) throw new Error("Database not connected");
    if (logs.length === 0) return 0;
    
    const collection: Collection<LoaderLogEntry> = this.db.collection("loader_logs");
    
    try {
      const result = await collection.insertMany(logs, { ordered: false });
      return result.insertedCount;
    } catch (error: unknown) {
      // Handle duplicates gracefully
      if (error && typeof error === "object" && "writeErrors" in error) {
        const writeErrors = (error as { writeErrors?: unknown[] }).writeErrors;
        if (writeErrors) {
          return logs.length - writeErrors.length;
        }
      }
      throw error;
    }
  }
  
  async upsertCrop(cropId: string, cropName: string, commodityGroup: string = ""): Promise<void> {
    if (!this.db) throw new Error("Database not connected");
    
    const crops = this.db.collection("crops");
    const now = new Date();
    
    await crops.updateOne(
      { _id: cropId },
      {
        $set: {
          name: cropName.toUpperCase(),
          commodityGroup: commodityGroup.toUpperCase(),
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );
  }
  
  async upsertMandi(
    mandiId: string,
    mandiName: string,
    stateId: string,
    stateName: string,
    districtId: string,
    districtName: string
  ): Promise<void> {
    if (!this.db) throw new Error("Database not connected");
    
    const mandis = this.db.collection("mandis");
    const now = new Date();
    
    await mandis.updateOne(
      { _id: mandiId },
      {
        $set: {
          name: mandiName.toUpperCase(),
          stateId: stateId.toLowerCase(),
          stateName: stateName.toUpperCase(),
          districtId: districtId.toLowerCase(),
          districtName: districtName.toUpperCase(),
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          location: {
            type: "Point",
            coordinates: [0, 0],
          },
        },
      },
      { upsert: true }
    );
  }
  
  async upsertState(stateId: string, stateName: string, code: string): Promise<void> {
    if (!this.db) throw new Error("Database not connected");
    
    const states = this.db.collection("states");
    const now = new Date();
    
    await states.updateOne(
      { _id: stateId },
      {
        $set: {
          name: stateName.toUpperCase(),
          code: code.toUpperCase(),
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          districts: [],
        },
      },
      { upsert: true }
    );
  }
}
