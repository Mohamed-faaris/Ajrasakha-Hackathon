import { z } from "zod";

export const PriceSchema = z.object({
  cropName: z.string(),
  mandiName: z.string(),
  date: z.string(),
  minPrice: z.number(),
  maxPrice: z.number(),
  modalPrice: z.number(),
  unit: z.string(),
  arrival: z.number().optional(),
  source: z.string().optional(),
});

export type Price = z.infer<typeof PriceSchema>;

interface AgmarknetInputRecord {
  "S.No"?: string;
  City?: string;
  Commodity?: string;
  commodity?: string;
  "Min Prize"?: string;
  "Min Price"?: string;
  min_price?: string;
  "Max Prize"?: string;
  "Max Price"?: string;
  max_price?: string;
  "Model Prize"?: string;
  "Modal Prize"?: string;
  "Modal Price"?: string;
  modal_price?: string;
  Date?: string;
  arrival_date?: string;
  Market?: string;
  market?: string;
  State?: string;
  state?: string;
  District?: string;
  district?: string;
  Variety?: string;
  variety?: string;
  Unit?: string;
  unit?: string;
  Arrival?: string;
  arrival?: string;
  "Price Unit"?: string;
}

interface State {
  _id: string;
  name: string;
  districts?: { _id: string; name: string }[];
}

interface Crop {
  _id: string;
  name: string;
}

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parsePrice(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseArrival(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return getTodayDate();
  
  const formats = [
    { regex: /(\d{1,2})-([A-Za-z]{3})-(\d{4})/, fn: (m: RegExpMatchArray) => {
      const months: Record<string, string> = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
      };
      const month = months[m[2].toLowerCase()] || "01";
      return `${m[3]}-${month}-${m[1].padStart(2, "0")}`;
    }},
    { regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/, fn: (m: RegExpMatchArray) => 
      `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` },
    { regex: /(\d{4})-(\d{2})-(\d{2})/, fn: (m: RegExpMatchArray) => m[0] },
  ];
  
  for (const fmt of formats) {
    const match = dateStr.match(fmt.regex);
    if (match) {
      return fmt.fn(match);
    }
  }
  
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  
  return dateStr;
}

function transformRecord(record: AgmarknetInputRecord): Price {
  const date = formatDate(
    record.Date || record.arrival_date || getTodayDate()
  );
  
  return {
    cropName: record.Commodity || record.commodity || "Unknown",
    mandiName: record.City || record.Market || record.market || record.District || "Unknown",
    date: date,
    minPrice: parsePrice(
      record["Min Prize"] || record["Min Price"] || record.min_price
    ),
    maxPrice: parsePrice(
      record["Max Prize"] || record["Max Price"] || record.max_price
    ),
    modalPrice: parsePrice(
      record["Model Prize"] || record["Modal Prize"] || record["Modal Price"] || record.modal_price
    ),
    unit: record.Unit || record.unit || record["Price Unit"] || "Rs/Quintal",
    arrival: parseArrival(record.Arrival || record.arrival),
    source: "agmarknet",
  };
}

async function loadReferenceData(dataPath: string): Promise<{ states: State[]; crops: Crop[] }> {
  const statesPath = `${dataPath}/states.converted.json`;
  const cropsPath = `${dataPath}/crops.converted.json`;
  
  const [statesFile, cropsFile] = await Promise.all([
    Bun.file(statesPath).text(),
    Bun.file(cropsPath).text(),
  ]);
  
  return {
    states: JSON.parse(statesFile),
    crops: JSON.parse(cropsFile),
  };
}

async function parseData(inputData: string): Promise<Price[]> {
  let records: AgmarknetInputRecord[] = [];
  
  try {
    const parsed = JSON.parse(inputData);
    if (Array.isArray(parsed)) {
      records = parsed;
    } else if (parsed.records && Array.isArray(parsed.records)) {
      records = parsed.records;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      records = parsed.data;
    } else {
      records = [parsed];
    }
  } catch (e) {
    try {
      const file = await Bun.file(inputData).text();
      const parsed = JSON.parse(file);
      if (Array.isArray(parsed)) {
        records = parsed;
      } else if (parsed.records && Array.isArray(parsed.records)) {
        records = parsed.records;
      } else if (parsed.data && Array.isArray(parsed.data)) {
        records = parsed.data;
      }
    } catch (fileError) {
      throw new Error(`Failed to parse input data: ${e}. Also tried reading as file: ${fileError}`);
    }
  }
  
  return records.map(transformRecord);
}

function parseArgs(): { dataPath: string; date: string; dataArg?: string; scrape?: boolean } {
  const args = process.argv.slice(2);
  const params = {
    dataPath: "../../seeder/data",
    date: getTodayDate(),
    dataArg: undefined as string | undefined,
    scrape: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--data":
        params.dataPath = args[++i];
        break;
      case "--date":
      case "-d":
        params.date = args[++i];
        break;
      case "--scrape":
      case "-s":
        params.scrape = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Agmarknet Parser
Parses or scrapes agmarknet data and outputs to PriceSchema format.

Usage:
  bun run scripts/agmarknet/index.ts [options] [data]

Options:
  --data PATH    Path to reference data (states, crops) [default: ../../seeder/data]
  --date, -d     Output date in YYYY-MM-DD format [default: today]
  --scrape, -s   Scrape data from agmarknet.gov.in
  -h, --help     Show this help

Arguments:
  data           JSON string or path to JSON file with scraped data [optional]
                 If not provided, will look for data/agmarknet/scraped.json

Example:
  bun run scripts/agmarknet/index.ts --scrape
  bun run scripts/agmarknet/index.ts --scrape --date 2026-02-01
  bun run scripts/agmarknet/index.ts '[{"Commodity":"Potato","Market":"Delhi",...}]'
  bun run scripts/agmarknet/index.ts --date 2026-02-01 ./scraped-data.json
        `);
        process.exit(0);
    }
  }

  const remainingArgs = args.filter(a => !a.startsWith("--") && !a.startsWith("-"));
  if (remainingArgs.length > 0) {
    params.dataArg = remainingArgs[0];
  }

  return params;
}

async function scrapeAgmarknet(date: string): Promise<AgmarknetInputRecord[]> {
  console.log(`Scraping agmarknet.gov.in for date: ${date}...`);
  
  const filtersUrl = "https://api.agmarknet.gov.in/v1/daily-price-arrival/filters";
  const filtersResponse = await fetch(filtersUrl, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0",
      "Accept": "application/json, text/plain, */*",
    },
  });
  
  const filtersData = await filtersResponse.json();
  const commodities = filtersData.data.cmdt_data;
  console.log(`Found ${commodities.length} commodities`);
  
  const allRecords: AgmarknetInputRecord[] = [];
  const [year, month, day] = date.split("-");
  const dateFormatted = `${day}-${month}-${year}`;
  
  const processCommodity = async (commodity: { cmdt_id: number; cmdt_name: string }): Promise<AgmarknetInputRecord[]> => {
    const commodityId = commodity.cmdt_id;
    const commodityName = commodity.cmdt_name;
    const recordsForCommodity: AgmarknetInputRecord[] = [];
    
    let page = 1;
    const limit = 100;
    let hasMore = true;
    
    while (hasMore) {
      try {
        const url = `https://api.agmarknet.gov.in/v1/daily-price-arrival/report?from_date=${date}&to_date=${date}&data_type=100006&group=1&commodity=${commodityId}&page=${page}&limit=${limit}`;
        
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:145.0) Gecko/20100101 Firefox/145.0",
            "Accept": "application/json, text/plain, */*",
          },
        });
        
        if (response.status === 404 || response.status === 500 || response.status === 400) {
          hasMore = false;
          continue;
        }
        
        if (!response.ok) {
          hasMore = false;
          continue;
        }
        
        const data = await response.json();
        
        if (!data.status || !data.data.records || data.data.records.length === 0) {
          hasMore = false;
          continue;
        }
        
        const record = data.data.records[0];
        const records = record.data || [];
        
        if (records.length === 0) {
          hasMore = false;
          continue;
        }
        
        for (const r of records) {
          const arrivalDate = r.arrival_date;
          if (arrivalDate === dateFormatted) {
            recordsForCommodity.push({
              Commodity: r.cmdt_name,
              Market: r.market_name,
              State: r.state_name,
              District: r.district_name,
              Variety: r.variety_name,
              "Min Price": r.min_price,
              "Max Price": r.max_price,
              "Modal Price": r.model_price,
              "Price Unit": r.unit_name_price || "Rs/Quintal",
              Arrival: r.arrival_qty,
              Date: date,
            });
          }
        }
        
        const pagination = record.pagination?.[0] || {};
        const totalPages = pagination.total_pages || 1;
        
        if (page >= totalPages) {
          hasMore = false;
        } else {
          page++;
        }
      } catch (e) {
        hasMore = false;
      }
    }
    
    return recordsForCommodity;
  };
  
  const batchSize = 10;
  for (let i = 0; i < commodities.length; i += batchSize) {
    const batch = commodities.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(processCommodity));
    
    for (const records of results) {
      allRecords.push(...records);
    }
    
    console.log(`  Processed ${Math.min(i + batchSize, commodities.length)}/${commodities.length} commodities, total records: ${allRecords.length}`);
  }
  
  console.log(`Total records fetched: ${allRecords.length}`);
  return allRecords;
}

async function main() {
  const args = parseArgs();
  
  console.log(`Parsing agmarknet data for date: ${args.date}`);
  console.log(`Reference data path: ${args.dataPath}`);

  try {
    let prices: Price[];
    
    if (args.scrape) {
      const scrapedData = await scrapeAgmarknet(args.date);
      prices = scrapedData.map(transformRecord);
    } else {
      const { states, crops } = await loadReferenceData(args.dataPath);
      console.log(`  Loaded ${states.length} states and ${crops.length} crops`);
      
      if (args.dataArg) {
        prices = await parseData(args.dataArg);
      } else {
        console.log("No input data provided. Use --help for usage information.");
        process.exit(1);
      }
    }
    
    const validatedPrices = prices.map((p) => PriceSchema.parse(p));
    
    const outputDir = `./data/agmarknet`;
    const outputPath = `${outputDir}/${args.date}.json`;
    await Bun.write(outputPath, JSON.stringify(validatedPrices, null, 2));
    
    console.log(`Successfully saved ${validatedPrices.length} records to ${outputPath}`);
    
    const stateNames = new Set(validatedPrices.map(p => p.mandiName.split(",").pop()?.trim()).filter(Boolean));
    const cropNames = new Set(validatedPrices.map(p => p.cropName).filter(Boolean));
    console.log(`  Unique crops: ${cropNames.size}`);
    console.log(`  Unique markets: ${stateNames.size}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
