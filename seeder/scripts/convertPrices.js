const fs = require('fs');
const path = require('path');

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

function findBestCropMatch(commodityName, crops) {
  const slug = generateSlug(commodityName);
  
  let match = crops.find(c => c._id === slug);
  if (match) return match;
  
  match = crops.find(c => c._id.startsWith(slug) || slug.startsWith(c._id));
  if (match) return match;
  
  const nameUpper = commodityName.toUpperCase();
  match = crops.find(c => c.name.includes(nameUpper) || nameUpper.includes(c.name));
  if (match) return match;
  
  const words = nameUpper.split(/[\s-]+/);
  for (const word of words) {
    if (word.length > 3) {
      match = crops.find(c => c.name.includes(word));
      if (match) return match;
    }
  }
  
  return null;
}

function findMandiBySourceId(sourceId, mandis) {
  return mandis.find(m => m.sourceMandiId === String(sourceId));
}

function findMandiByApmcName(apmcName, stateName, mandis) {
  const apmcUpper = apmcName.trim().toUpperCase();
  const stateUpper = stateName.trim().toUpperCase();
  
  const candidates = mandis.filter(m => {
    const mandiApmc = m.name.replace(/ APMC$/i, '').trim().toUpperCase();
    return mandiApmc.includes(apmcUpper) || apmcUpper.includes(mandiApmc);
  });
  
  if (candidates.length === 0) return null;
  
  const stateMatch = candidates.find(m => 
    m.stateName.includes(stateUpper) || stateUpper.includes(m.stateName)
  );
  
  return stateMatch || candidates[0];
}

function convertEnamPrices(inputPath, outputPath, cropsPath, mandisPath) {
  const enamData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const crops = JSON.parse(fs.readFileSync(cropsPath, 'utf8'));
  const mandis = JSON.parse(fs.readFileSync(mandisPath, 'utf8'));

  const prices = [];
  const stats = { matched: 0, unmatchedCrops: new Set(), unmatchedMandis: new Set() };

  for (const item of enamData.data) {
    const crop = findBestCropMatch(item.commodity, crops);
    const mandi = findMandiByApmcName(item.apmc, item.state, mandis);

    if (!crop) stats.unmatchedCrops.add(item.commodity);
    if (!mandi) stats.unmatchedMandis.add(`${item.apmc} (${item.state})`);

    if (crop && mandi) {
      stats.matched++;
      prices.push({
        cropId: crop._id,
        cropName: crop.name,
        mandiId: mandi._id,
        mandiName: mandi.name,
        stateId: mandi.stateId,
        stateName: mandi.stateName,
        districtId: mandi.districtId,
        districtName: mandi.districtName,
        date: item.created_at,
        minPrice: parseInt(item.min_price, 10) || 0,
        maxPrice: parseInt(item.max_price, 10) || 0,
        modalPrice: parseInt(item.modal_price, 10) || 0,
        unit: item.Commodity_Uom || 'Qui',
        arrival: parseInt(item.commodity_arrivals, 10) || null,
        source: 'enam',
        sourceId: item.id,
      });
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(prices, null, 2));

  console.log(`Converted ${prices.length} prices from eNAM`);
  console.log(`Output: ${outputPath}`);
  
  if (stats.unmatchedCrops.size > 0) {
    console.log(`\nUnmatched crops (${stats.unmatchedCrops.size}):`);
    [...stats.unmatchedCrops].forEach(c => console.log(`  - ${c}`));
  }
  
  if (stats.unmatchedMandis.size > 0) {
    console.log(`\nUnmatched mandis (${stats.unmatchedMandis.size}):`);
    [...stats.unmatchedMandis].forEach(m => console.log(`  - ${m}`));
  }

  return prices;
}

function convertAgmarknetPrices(inputPath, outputPath, cropsPath, mandisPath, sourceDataPath) {
  const priceData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const crops = JSON.parse(fs.readFileSync(cropsPath, 'utf8'));
  const mandis = JSON.parse(fs.readFileSync(mandisPath, 'utf8'));
  const sourceData = JSON.parse(fs.readFileSync(sourceDataPath, 'utf8'));

  const cmdtIdToCropSlug = {};
  sourceData.data.cmdt_data.forEach(c => {
    const slug = generateSlug(c.cmdt_name);
    const crop = crops.find(cr => cr._id === slug || cr._id.startsWith(slug));
    if (crop) cmdtIdToCropSlug[c.cmdt_id] = crop;
  });

  const marketIdToMandi = {};
  mandis.forEach(m => {
    marketIdToMandi[m.sourceMandiId] = m;
  });

  const prices = [];
  const records = priceData.data || priceData;

  for (const record of records) {
    const cmdtId = record.commodity_id || record.cmdt_id;
    const marketId = record.market_id || record.mkt_id;
    
    const crop = cmdtIdToCropSlug[cmdtId];
    const mandi = marketIdToMandi[String(marketId)];

    if (crop && mandi) {
      prices.push({
        cropId: crop._id,
        cropName: crop.name,
        mandiId: mandi._id,
        mandiName: mandi.name,
        stateId: mandi.stateId,
        stateName: mandi.stateName,
        districtId: mandi.districtId,
        districtName: mandi.districtName,
        date: record.arrival_date || record.date,
        minPrice: parseInt(record.min_price, 10) || 0,
        maxPrice: parseInt(record.max_price, 10) || 0,
        modalPrice: parseInt(record.modal_price, 10) || 0,
        unit: record.unit || 'Qui',
        arrival: parseInt(record.arrival, 10) || null,
        source: 'agmarknet',
        sourceId: String(record.id || ''),
      });
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(prices, null, 2));

  console.log(`Converted ${prices.length} prices from Agmarknet`);
  console.log(`Output: ${outputPath}`);

  return prices;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage:');
    console.log('  node convertPrices.js enam <input.json> <output.json> [crops.json] [mandis.json]');
    console.log('  node convertPrices.js agmarknet <input.json> <output.json> <crops.json> <mandis.json> <sourceData.json>');
    console.log('');
    console.log('Examples:');
    console.log('  node convertPrices.js enam enam.json prices.json crops.json mandis.json');
    console.log('  node convertPrices.js agmarknet api-response.json prices.json crops.json mandis.json data.json');
    process.exit(1);
  }

  const [format, inputPath, outputPath, ...extraArgs] = args;
  
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  if (format === 'enam') {
    const defaultCrops = path.join(__dirname, '../data/crops.converted.json');
    const defaultMandis = path.join(__dirname, '../data/mandis.converted.json');
    const cropsPath = extraArgs[0] || defaultCrops;
    const mandisPath = extraArgs[1] || defaultMandis;
    
    if (!fs.existsSync(cropsPath) || !fs.existsSync(mandisPath)) {
      console.error('Error: crops.json and mandis.json are required. Run convertCrops.js and convertMandis.js first.');
      process.exit(1);
    }
    
    convertEnamPrices(inputPath, outputPath, cropsPath, mandisPath);
  } else if (format === 'agmarknet') {
    const [cropsPath, mandisPath, sourceDataPath] = extraArgs;
    
    if (!cropsPath || !mandisPath || !sourceDataPath) {
      console.error('Error: agmarknet format requires crops.json, mandis.json, and sourceData.json');
      process.exit(1);
    }
    
    convertAgmarknetPrices(inputPath, outputPath, cropsPath, mandisPath, sourceDataPath);
  } else {
    console.error(`Error: Unknown format "${format}". Use "enam" or "agmarknet".`);
    process.exit(1);
  }
}

main();
