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

interface KrishimaratavahiniInputRecord {
  Commodity?: string;
  Variety?: string;
  Market?: string;
  MinPrice?: string;
  MaxPrice?: string;
  ModalPrice?: string;
  Unit?: string;
  Date?: string;
  Arrival?: string;
  State?: string;
  District?: string;
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
  
  return dateStr;
}

function toAPIDateFormat(dateStr: string): string {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return dateStr;
}

function transformRecord(record: KrishimaratavahiniInputRecord): Price {
  const date = formatDate(record.Date || getTodayDate());
  
  return {
    cropName: record.Commodity || "Unknown",
    mandiName: record.Market || record.District || "Unknown",
    date: date,
    minPrice: parsePrice(record.MinPrice),
    maxPrice: parsePrice(record.MaxPrice),
    modalPrice: parsePrice(record.ModalPrice),
    unit: record.Unit || "Rs/Quintal",
    arrival: parseArrival(record.Arrival),
    source: "krishimaratavahini",
  };
}

function parseArgs(): { date: string; dataArg?: string } {
  const args = process.argv.slice(2);
  const params = {
    date: getTodayDate(),
    dataArg: undefined as string | undefined,
  };

  const consumedArgs = new Set<number>();
  
  for (let i = 0; i < args.length; i++) {
    if (consumedArgs.has(i)) continue;
    
    switch (args[i]) {
      case "--date":
      case "-d":
        params.date = args[++i];
        consumedArgs.add(i);
        consumedArgs.add(i - 1);
        break;
      case "--help":
      case "-h":
        console.log(`
Krishimaratavahini Parser
Scrapes Karnataka market prices via agmarknet API.

Usage:
  bun run scripts/krishimaratavahini/index.ts [options] [data]

Options:
  --date, -d     Date in YYYY-MM-DD format [default: today]
  -h, --help     Show this help
        `);
        process.exit(0);
    }
  }

  const remainingArgs = args.filter((_, idx) => !consumedArgs.has(idx));
  if (remainingArgs.length > 0) {
    params.dataArg = remainingArgs[0];
  }

  return params;
}

async function fetchCommodity(commodityId: number, apiDate: string, date: string): Promise<KrishimaratavahiniInputRecord[]> {
  const url = `https://api.agmarknet.gov.in/v1/daily-price-arrival/report?from_date=${apiDate}&to_date=${apiDate}&data_type=100006&group=1&commodity=${commodityId}&page=1&limit=50`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    if (!data.status || !data.data?.records?.length) return [];
    
    const records = data.data.records[0].data || [];
    const karnatakaRecords: KrishimaratavahiniInputRecord[] = [];
    
    for (const r of records) {
      const stateName = r.state_name || "";
      if (stateName.toLowerCase().includes("karnataka")) {
        karnatakaRecords.push({
          Commodity: r.cmdt_name,
          Variety: r.variety_name,
          Market: r.market_name,
          MinPrice: r.min_price,
          MaxPrice: r.max_price,
          ModalPrice: r.model_price,
          Unit: r.unit_name_price,
          Date: date,
          State: r.state_name,
          District: r.district_name,
          Arrival: r.arrival_qty,
        });
      }
    }
    
    return karnatakaRecords;
  } catch {
    return [];
  }
}

async function scrapeKrishimaratavahini(date: string): Promise<KrishimaratavahiniInputRecord[]> {
  const apiDate = toAPIDateFormat(date);
  console.log(`Fetching Karnataka prices for date: ${date} (API format: ${apiDate})...`);
  
  const filtersUrl = "https://api.agmarknet.gov.in/v1/daily-price-arrival/filters";
  const filtersResponse = await fetch(filtersUrl);
  const filtersData = await filtersResponse.json();
  const commoditiesList = filtersData.data.cmdt_data;
  
  const commodityIds = commoditiesList
    .sort((a: { cmdt_id: number }, b: { cmdt_id: number }) => a.cmdt_id - b.cmdt_id)
    .slice(0, 100)
    .map((c: { cmdt_id: number }) => c.cmdt_id);
  const allRecords: KrishimaratavahiniInputRecord[] = [];
  
  console.log(`Fetching ${commodityIds.length} commodities concurrently...`);
  
  const batchSize = 10;
  for (let i = 0; i < commodityIds.length; i += batchSize) {
    const batch = commodityIds.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(id => fetchCommodity(id, apiDate, date)));
    
    for (const records of results) {
      allRecords.push(...records);
    }
    
    console.log(`  Processed ${Math.min(i + batchSize, commodityIds.length)}/${commodityIds.length}, found ${allRecords.length} records...`);
  }
  
  console.log(`Found ${allRecords.length} Karnataka records`);
  return allRecords;
}

async function main() {
  const args = parseArgs();
  
  console.log(`Krishimaratavahini scraper for date: ${args.date}`);

  try {
    let prices: Price[];
    
    if (args.dataArg) {
      const parsed = JSON.parse(args.dataArg);
      prices = (Array.isArray(parsed) ? parsed : [parsed]).map(transformRecord);
    } else {
      const scrapedData = await scrapeKrishimaratavahini(args.date);
      prices = scrapedData.map(transformRecord);
    }
    
    const validatedPrices = prices.map((p) => PriceSchema.parse(p));
    
    const outputPath = `./data/krishimaratavahini/${args.date}.json`;
    await Bun.write(outputPath, JSON.stringify(validatedPrices, null, 2));
    
    console.log(`Saved ${validatedPrices.length} records to ${outputPath}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
