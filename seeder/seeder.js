const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

let dotenv;
try {
  dotenv = require('dotenv');
  dotenv.config({ path: path.join(__dirname, '../server/.env') });
} catch (e) {
  // dotenv not available, rely on process.env
}

const CROPS_PATH = path.join(__dirname, 'data/crops.converted.json');
const STATES_PATH = path.join(__dirname, 'data/states.converted.json');
const MANDIS_PATH = path.join(__dirname, 'data/mandis.converted.json');
const PRICES_PATH = path.join(__dirname, 'data/prices.converted.json');

const cropSchema = new mongoose.Schema({
  _id: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, required: true, uppercase: true, trim: true },
  commodityGroup: { type: String, trim: true },
}, { timestamps: true, collection: 'crops' });

const stateSchema = new mongoose.Schema({
  _id: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, required: true, lowercase: true, trim: true },
  districts: [{
    _id: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, lowercase: true, trim: true },
  }],
}, { timestamps: true, collection: 'states' });

const mandiSchema = new mongoose.Schema({
  _id: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, required: true, uppercase: true, trim: true },
  stateId: { type: String, required: true, ref: 'State' },
  stateName: { type: String, required: true, uppercase: true },
  districtId: { type: String, trim: true, lowercase: true },
  districtName: { type: String, required: true, uppercase: true, trim: true },
  sourceMandiId: { type: String, trim: true, lowercase: true },
}, { timestamps: true, collection: 'mandis' });

const priceSchema = new mongoose.Schema({
  cropId: { type: String, required: true, ref: 'Crop' },
  cropName: { type: String, required: true, uppercase: true },
  mandiId: { type: String, required: true, ref: 'Mandi' },
  mandiName: { type: String, required: true, uppercase: true },
  stateId: { type: String, required: true, ref: 'State' },
  stateName: { type: String, required: true, uppercase: true },
  districtId: { type: String, trim: true, lowercase: true },
  districtName: { type: String, required: true, uppercase: true },
  date: { type: Date, required: true },
  minPrice: { type: Number, required: true, min: 0 },
  maxPrice: { type: Number, required: true, min: 0 },
  modalPrice: { type: Number, required: true, min: 0 },
  unit: { type: String, default: 'Qui' },
  arrival: { type: Number, min: 0 },
  source: { type: String, enum: ['agmarknet', 'enam', 'other'], default: 'other' },
  sourceId: { type: String, trim: true },
}, { timestamps: true, collection: 'prices' });

const Crop = mongoose.model('Crop', cropSchema);
const State = mongoose.model('State', stateSchema);
const Mandi = mongoose.model('Mandi', mandiSchema);
const Price = mongoose.model('Price', priceSchema);

async function seedCrops() {
  if (!fs.existsSync(CROPS_PATH)) {
    console.log('No crops data found. Run convertCrops.js first.');
    return 0;
  }
  
  const crops = JSON.parse(fs.readFileSync(CROPS_PATH, 'utf8'));
  await Crop.deleteMany({});
  const result = await Crop.insertMany(crops);
  console.log(`Seeded ${result.length} crops`);
  return result.length;
}

async function seedStates() {
  if (!fs.existsSync(STATES_PATH)) {
    console.log('No states data found. Run convertStates.js first.');
    return 0;
  }
  
  const states = JSON.parse(fs.readFileSync(STATES_PATH, 'utf8'));
  await State.deleteMany({});
  const result = await State.insertMany(states);
  console.log(`Seeded ${result.length} states`);
  return result.length;
}

async function seedMandis() {
  if (!fs.existsSync(MANDIS_PATH)) {
    console.log('No mandis data found. Run convertMandis.js first.');
    return 0;
  }
  
  const mandis = JSON.parse(fs.readFileSync(MANDIS_PATH, 'utf8'));
  await Mandi.deleteMany({});
  
  let inserted = 0;
  const batchSize = 500;
  
  for (let i = 0; i < mandis.length; i += batchSize) {
    const batch = mandis.slice(i, i + batchSize);
    await Mandi.insertMany(batch);
    inserted += batch.length;
    process.stdout.write(`\rSeeding mandis: ${inserted}/${mandis.length}`);
  }
  
  console.log(`\nSeeded ${inserted} mandis`);
  return inserted;
}

async function seedPrices() {
  if (!fs.existsSync(PRICES_PATH)) {
    console.log('No prices data found. Run convertPrices.js first.');
    return 0;
  }
  
  const prices = JSON.parse(fs.readFileSync(PRICES_PATH, 'utf8'));
  await Price.deleteMany({});
  
  let inserted = 0;
  const batchSize = 500;
  
  for (let i = 0; i < prices.length; i += batchSize) {
    const batch = prices.slice(i, i + batchSize);
    await Price.insertMany(batch);
    inserted += batch.length;
    process.stdout.write(`\rSeeding prices: ${inserted}/${prices.length}`);
  }
  
  console.log(`\nSeeded ${inserted} prices`);
  return inserted;
}

async function clearCollection(name) {
  switch (name) {
    case 'crops': await Crop.deleteMany({}); break;
    case 'states': await State.deleteMany({}); break;
    case 'mandis': await Mandi.deleteMany({}); break;
    case 'prices': await Price.deleteMany({}); break;
    default: console.log(`Unknown collection: ${name}`);
  }
  console.log(`Cleared ${name}`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    console.error('Error: MONGO_URI not found in environment');
    console.log('Create a .env file in the server directory with MONGO_URI');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB: ${mongoose.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }

  try {
    switch (command) {
      case 'crops':
        await seedCrops();
        break;
      case 'states':
        await seedStates();
        break;
      case 'mandis':
        await seedMandis();
        break;
      case 'prices':
        await seedPrices();
        break;
      case 'all':
        await seedCrops();
        await seedStates();
        await seedMandis();
        await seedPrices();
        break;
      case 'clear':
        const collection = args[1];
        if (collection === 'all') {
          await Crop.deleteMany({});
          await State.deleteMany({});
          await Mandi.deleteMany({});
          await Price.deleteMany({});
          console.log('Cleared all collections');
        } else {
          await clearCollection(collection);
        }
        break;
      default:
        console.log('Seeder Commands:');
        console.log('  node seeder.js crops    - Seed crops');
        console.log('  node seeder.js states   - Seed states');
        console.log('  node seeder.js mandis   - Seed mandis');
        console.log('  node seeder.js prices   - Seed prices');
        console.log('  node seeder.js all      - Seed all collections');
        console.log('  node seeder.js clear <collection|all> - Clear collection(s)');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();
