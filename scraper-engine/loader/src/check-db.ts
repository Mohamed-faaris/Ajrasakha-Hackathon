import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ajrasakha";

async function checkDatabase() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log("Connected to MongoDB\n");
    
    const db = client.db("ajrasakha");
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log("Collections:");
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`   - ${col.name}: ${count} documents`);
    }
    
    console.log("\n" + "=".repeat(60));
    
    // Check prices collection
    const prices = db.collection("prices");
    const priceCount = await prices.countDocuments();
    console.log(`\nPrices Collection: ${priceCount} documents`);
    
    if (priceCount > 0) {
      // Sample price
      const samplePrice = await prices.findOne({});
      console.log("\nSample Price Document:");
      console.log(JSON.stringify(samplePrice, null, 2));
      
      // Stats by source
      console.log("\nPrices by Source:");
      const bySource = await prices.aggregate([
        { $group: { _id: "$source", count: { $sum: 1 } } }
      ]).toArray();
      for (const s of bySource) {
        console.log(`   - ${s._id}: ${s.count}`);
      }
      
      // Stats by date
      console.log("\nDate Range:");
      const dateRange = await prices.aggregate([
        { $group: { _id: null, minDate: { $min: "$date" }, maxDate: { $max: "$date" } } }
      ]).toArray();
      if (dateRange.length > 0) {
        console.log(`   - From: ${dateRange[0].minDate}`);
        console.log(`   - To: ${dateRange[0].maxDate}`);
      }
      
      // Unique crops and mandis
      const uniqueCrops = await prices.distinct("cropId");
      const uniqueMandis = await prices.distinct("mandiId");
      const uniqueStates = await prices.distinct("stateId");
      console.log(`\nUnique Crops: ${uniqueCrops.length}`);
      console.log(`Unique Mandis: ${uniqueMandis.length}`);
      console.log(`Unique States: ${uniqueStates.length}`);
    }
    
    // Check crops collection
    console.log("\n" + "=".repeat(60));
    const crops = db.collection("crops");
    const cropCount = await crops.countDocuments();
    console.log(`\nCrops Collection: ${cropCount} documents`);
    if (cropCount > 0) {
      const sample = await crops.findOne({});
      console.log("Sample:", JSON.stringify(sample, null, 2));
    }
    
    // Check states collection
    const states = db.collection("states");
    const stateCount = await states.countDocuments();
    console.log(`\nStates Collection: ${stateCount} documents`);
    if (stateCount > 0) {
      const allStates = await states.find({}, { projection: { _id: 1, name: 1 } }).toArray();
      console.log("States:", allStates.map(s => s.name || s._id).join(", "));
    }
    
    // Check mandis collection
    const mandis = db.collection("mandis");
    const mandiCount = await mandis.countDocuments();
    console.log(`\nMandis Collection: ${mandiCount} documents`);
    
    // Check loader_logs
    const logs = db.collection("loader_logs");
    const logCount = await logs.countDocuments();
    console.log(`\nLoader Logs: ${logCount} documents`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("\nConnection closed");
  }
}

checkDatabase();
