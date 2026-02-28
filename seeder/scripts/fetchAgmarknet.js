const fs = require('fs');
const path = require('path');

const AGMARKNET_API = 'https://api.agmarknet.gov.in/v1/daily-price-arrival/report';

const DATA_DIR = path.join(__dirname, '../data');
const CROPS_PATH = path.join(DATA_DIR, 'crops.converted.json');
const MANDIS_PATH = path.join(DATA_DIR, 'mandis.converted.json');

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

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

function loadReferenceData() {
  const crops = JSON.parse(fs.readFileSync(CROPS_PATH, 'utf8'));
  const mandis = JSON.parse(fs.readFileSync(MANDIS_PATH, 'utf8'));
  
  return { crops, mandis };
}

async function fetchPrices(params) {
  const queryStr = new URLSearchParams(params).toString();
  const url = `${AGMARKNET_API}?${queryStr}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Fetch error: ${error.message}`);
    throw error;
  }
}

async function fetchAllPages(baseParams, maxPages = 100, pageSize = 500) {
  const allRecords = [];
  
  for (let page = 1; page <= maxPages; page++) {
    const params = {
      ...baseParams,
      page: page.toString(),
      limit: pageSize.toString(),
    };
    
    console.log(`Fetching page ${page}...`);
    
    const data = await fetchPrices(params);
    const records = extractRecords(data);
    
    if (!records || records.length === 0) {
      console.log(`No records on page ${page}, stopping.`);
      break;
    }
    
    allRecords.push(...records);
    console.log(`  Got ${records.length} records (total: ${allRecords.length})`);
    
    if (records.length < pageSize) {
      console.log('Last page reached.');
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return allRecords;
}

function extractRecords(data) {
  if (data && data.data && data.data.records && Array.isArray(data.data.records)) {
    if (data.data.records[0] && data.data.records[0].data && Array.isArray(data.data.records[0].data)) {
      return data.data.records[0].data;
    }
  }
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of ['data', 'records', 'items', 'results', 'rows', 'list']) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return [];
}

function parseNumber(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return dateStr;
}

function buildLookupMaps(crops, mandis) {
  const cropBySourceId = {};
  const cropBySlug = {};
  const cropByName = {};
  
  crops.forEach(crop => {
    if (crop.sourceId) cropBySourceId[crop.sourceId] = crop;
    cropBySlug[crop._id] = crop;
    cropByName[crop.name.toUpperCase()] = crop;
  });

  const mandiBySourceId = {};
  const mandiByName = {};
  const mandiByNameState = {};
  
  mandis.forEach(mandi => {
    if (mandi.sourceMandiId) mandiBySourceId[mandi.sourceMandiId] = mandi;
    mandiByName[mandi.name.toUpperCase()] = mandi;
    const key = `${mandi.name.toUpperCase()}|${mandi.stateName.toUpperCase()}`;
    mandiByNameState[key] = mandi;
  });

  return { cropBySourceId, cropBySlug, cropByName, mandiBySourceId, mandiByName, mandiByNameState };
}

function findCrop(record, lookup) {
  const cmdtName = (record.cmdt_name || record.commodity || '').toUpperCase();
  
  if (lookup.cropByName[cmdtName]) return lookup.cropByName[cmdtName];
  
  const slug = generateSlug(record.cmdt_name || record.commodity || '');
  if (lookup.cropBySlug[slug]) return lookup.cropBySlug[slug];
  
  const partialMatch = Object.keys(lookup.cropByName).find(name => 
    name.includes(cmdtName) || cmdtName.includes(name)
  );
  if (partialMatch) return lookup.cropByName[partialMatch];
  
  return null;
}

function findMandi(record, lookup) {
  const marketName = (record.market_name || record.apmc || '').toUpperCase().trim();
  const stateName = (record.state_name || record.state || '').toUpperCase().trim();
  
  const key = `${marketName}|${stateName}`;
  if (lookup.mandiByNameState[key]) return lookup.mandiByNameState[key];
  
  if (lookup.mandiByName[marketName]) return lookup.mandiByName[marketName];
  
  const marketBase = marketName.replace(/ APMC$/i, '').replace(/\s+/g, ' ').trim();
  const match = Object.keys(lookup.mandiByNameState).find(k => {
    const [mName, sName] = k.split('|');
    const mBase = mName.replace(/ APMC$/i, '').replace(/\s+/g, ' ').trim();
    return sName === stateName && (mBase.includes(marketBase) || marketBase.includes(mBase));
  });
  if (match) return lookup.mandiByNameState[match];
  
  return null;
}

function transformRecord(record, lookup) {
  const crop = findCrop(record, lookup);
  const mandi = findMandi(record, lookup);
  
  if (!crop || !mandi) {
    return { crop, mandi };
  }
  
  return {
    cropId: crop._id,
    cropName: crop.name,
    mandiId: mandi._id,
    mandiName: mandi.name,
    stateId: mandi.stateId,
    stateName: mandi.stateName,
    districtId: mandi.districtId,
    districtName: mandi.districtName || (record.district_name || '').toUpperCase(),
    date: parseDate(record.arrival_date || record.date || record.created_at),
    minPrice: parseNumber(record.min_price),
    maxPrice: parseNumber(record.max_price),
    modalPrice: parseNumber(record.model_price || record.modal_price),
    unit: record.unit_name_price || record.unit || 'Qui',
    arrival: parseNumber(record.arrival_qty || record.arrival),
    source: 'agmarknet',
    sourceId: String(record.id || record.record_id || ''),
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    fromDate: null,
    toDate: null,
    output: path.join(DATA_DIR, 'prices.fetched.json'),
    maxPages: 100,
    pageSize: 500,
  };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--from':
        params.fromDate = args[++i];
        break;
      case '--to':
        params.toDate = args[++i];
        break;
      case '--output':
      case '-o':
        params.output = args[++i];
        break;
      case '--pages':
        params.maxPages = parseInt(args[++i], 10);
        break;
      case '--limit':
        params.pageSize = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        console.log(`
Agmarknet API Fetcher
Fetches daily price data from Agmarknet API and converts to Price schema.

Usage:
  node fetchAgmarknet.js --from YYYY-MM-DD --to YYYY-MM-DD [options]

Options:
  --from DATE       Start date (YYYY-MM-DD) [required]
  --to DATE         End date (YYYY-MM-DD) [required]
  -o, --output FILE Output JSON file [default: data/prices.fetched.json]
  --pages NUM       Max pages to fetch [default: 100]
  --limit NUM       Records per page [default: 500]
  -h, --help        Show this help

Example:
  node fetchAgmarknet.js --from 2026-02-01 --to 2026-02-17
`);
        process.exit(0);
    }
  }
  
  if (!params.fromDate || !params.toDate) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    if (!params.fromDate) {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const wyyyy = weekAgo.getFullYear();
      const wmm = String(weekAgo.getMonth() + 1).padStart(2, '0');
      const wdd = String(weekAgo.getDate()).padStart(2, '0');
      params.fromDate = `${wyyyy}-${wmm}-${wdd}`;
    }
    if (!params.toDate) {
      params.toDate = dateStr;
    }
    console.log(`Using date range: ${params.fromDate} to ${params.toDate}`);
  }
  
  return params;
}

async function main() {
  const args = parseArgs();
  
  console.log('Loading reference data...');
  const { crops, mandis } = loadReferenceData();
  const lookup = buildLookupMaps(crops, mandis);
  console.log(`  Crops: ${crops.length} loaded`);
  console.log(`  Mandis: ${mandis.length} loaded`);
  
  const apiParams = {
    from_date: args.fromDate,
    to_date: args.toDate,
    data_type: '100006',
    state: '[100000]',
    district: '[100001]',
    market: '[100002]',
    grade: '[100003]',
    variety: '[100007]',
  };
  
  console.log('\nFetching from Agmarknet API...');
  console.log(`  URL: ${AGMARKNET_API}`);
  console.log(`  Date range: ${args.fromDate} to ${args.toDate}`);
  
  const records = await fetchAllPages(apiParams, args.maxPages, args.pageSize);
  console.log(`\nFetched ${records.length} raw records`);
  
  console.log('Transforming records...');
  const prices = [];
  const unmatchedCrops = new Set();
  const unmatchedMandis = new Set();
  const stats = { matched: 0, noCrop: 0, noMandi: 0 };
  
  for (const record of records) {
    const result = transformRecord(record, lookup);
    
    if (result.cropId) {
      prices.push(result);
      stats.matched++;
    } else {
      if (!result.crop) {
        stats.noCrop++;
        unmatchedCrops.add(record.cmdt_name || record.commodity);
      }
      if (!result.mandi) {
        stats.noMandi++;
        unmatchedMandis.add(`${record.market_name || record.apmc} (${record.state_name || record.state})`);
      }
    }
  }
  
  console.log(`Transformed ${prices.length} prices`);
  console.log(`  Matched: ${stats.matched}`);
  console.log(`  No crop mapping: ${stats.noCrop}`);
  console.log(`  No mandi mapping: ${stats.noMandi}`);
  
  if (unmatchedCrops.size > 0 && unmatchedCrops.size <= 20) {
    console.log('\nUnmatched crops:');
    [...unmatchedCrops].forEach(c => console.log(`  - ${c}`));
  }
  
  if (unmatchedMandis.size > 0 && unmatchedMandis.size <= 20) {
    console.log('\nUnmatched mandis:');
    [...unmatchedMandis].forEach(m => console.log(`  - ${m}`));
  }
  
  fs.writeFileSync(args.output, JSON.stringify(prices, null, 2));
  console.log(`\nOutput saved to: ${args.output}`);
  
  return prices.length;
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
