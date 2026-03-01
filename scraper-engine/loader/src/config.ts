import { dirname, join } from "path";

// Get the loader directory (parent of src)
const __dirname = dirname(new URL(import.meta.url).pathname);
export const LOADER_DIR = dirname(__dirname);

// State code to name mapping
export const STATE_CODE_MAP: Record<string, string> = {
  AP: "ANDHRA PRADESH",
  AR: "ARUNACHAL PRADESH",
  AS: "ASSAM",
  BR: "BIHAR",
  CT: "CHHATTISGARH",
  GA: "GOA",
  GJ: "GUJARAT",
  HR: "HARYANA",
  HP: "HIMACHAL PRADESH",
  JH: "JHARKHAND",
  KA: "KARNATAKA",
  KL: "KERALA",
  MP: "MADHYA PRADESH",
  MH: "MAHARASHTRA",
  MN: "MANIPUR",
  ML: "MEGHALAYA",
  MZ: "MIZORAM",
  NL: "NAGALAND",
  OR: "ODISHA",
  PB: "PUNJAB",
  RJ: "RAJASTHAN",
  SK: "SIKKIM",
  TN: "TAMIL NADU",
  TG: "TELANGANA",
  TR: "TRIPURA",
  UP: "UTTAR PRADESH",
  UT: "UTTARAKHAND",
  WB: "WEST BENGAL",
  AN: "ANDAMAN AND NICOBAR ISLANDS",
  CH: "CHANDIGARH",
  DN: "DADRA AND NAGAR HAVELI",
  DD: "DAMAN AND DIU",
  DL: "DELHI",
  JK: "JAMMU AND KASHMIR",
  LA: "LADAKH",
  LD: "LAKSHADWEEP",
  PY: "PUDUCHERRY",
};

// Source to enum mapping for Price.source field
export const SOURCE_ENUM_MAP: Record<string, string> = {
  agmarknet: "agmarknet",
  msamb: "apmc",
  krishimaratavahini: "apmc",
};

// Available sources
export const SOURCES = ["agmarknet", "msamb", "krishimaratavahini"];

// Paths configuration (absolute paths)
export const PATHS = {
  cropMap: join(LOADER_DIR, "../mapper/crop-map"),
  apmcMap: join(LOADER_DIR, "../mapper-apmc/apmc-map"),
  parserData: join(LOADER_DIR, "../parser/data"),
};

// MongoDB config from env
export function getMongoConfig() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ajrasakha";
  const dbName = process.env.DB_NAME || "ajrasakha";
  return { mongoUri, dbName };
}

// CLI args parser
export function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    date: new Date().toISOString().split("T")[0],
    source: "all",
    dryRun: false,
    batchSize: 1000,
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
      case "--dry-run":
        params.dryRun = true;
        break;
      case "--batch-size":
      case "-b":
        params.batchSize = parseInt(args[++i], 10);
        break;
      case "--help":
      case "-h":
        console.log(`
Price Loader v2.0
Loads price data from parser output into MongoDB.

Usage:
  bun run loader [options]

Options:
  -d, --date <date>       Date in YYYY-MM-DD format [default: today]
  -s, --source <source>   Source: agmarknet, msamb, krishimaratavahini, all [default: all]
  --dry-run               Validate without inserting
  -b, --batch-size <n>    Batch size for inserts [default: 1000]
  -h, --help              Show this help

Examples:
  bun run loader -d 2026-03-01 -s agmarknet
  bun run loader -d 2026-03-01 -s msamb --dry-run
        `);
        process.exit(0);
    }
  }

  return params;
}
