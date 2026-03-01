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

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const CROP_TRANSLATION: Record<string, string> = {
  "आंबा": "Mango", "सफरचंद": "Pomegranate", "केळी": "Banana", "द्राक्ष": "Grapes",
  "संत्री": "Orange", "लिंबू": "Lemon", "पपई": "Papaya", "अननस": "Pineapple",
  "बोर": "Ber", "फणस": "Jackfruit", "चिकू": "Chiku", "पेरु": "Pear",
  "सिताफळ": "Custard Apple", "आवळा": "Amla", "मोसंबी": "Mosambi",
  "टोमॅटो": "Tomato", "कांदा": "Onion", "बटाटा": "Potato", "वांगी": "Okra",
  "भेंडी": "Lady Finger", "काकडी": "Cucumber", "कोबी": "Cabbage", "फ्लॉवर": "Cauliflower",
  "गाजर": "Carrot", "बीट": "Beet Root", "मुळा": "Radish", "कढिपत्ता": "Green Chilli",
  "मिरची": "Chilli", "लसूण": "Garlic", "आले": "Ginger", "पालक": "Spinach",
  "मेथी": "Fenugreek", "कोथिंबिर": "Coriander", "शेपू": "Fenugreek Leaves",
  "घेवडा": "Cowpea", "गवार": "Cluster Bean", "भुईमुग": "Groundnut", "सोयाबिन": "Soybean",
  "मका": "Maize", "गहू": "Wheat", "तांदूळ": "Rice", "ज्वारी": "Sorghum",
  "बाजरी": "Pearl Millet", "नाचणी": "Small Millet", "हरभरा": "Chickpea", "तूर": "Pigeon Pea",
  "मूग": "Green Gram", "उडीद": "Black Gram", "मसूर": "Lentil", "वाटाणा": "Pea",
  "गुलाब": "Rose", "जास्वंद": "Marigold", "चाफा": "Jasmine", "शेवंती": "Chrysanthemum",
  "कारली": "Bitter Gourd", "भोपळा": "Bottle Gourd", "पडवळ": "Ash Gourd", "दुधी भोपळा": "Little Gourd",
  "ढेमसे": "Pointed Gourd", "तोंडली": "Indian Bean", "वाल भाजी": "Lablab Bean",
  "मटार": "Peas", "हरभरा भाजी": "Fresh Chickpea", "तूर भाजी": "Pigeon Pea Veg",
  "चवळी": "Green Gram Veg", "अंबाडी भाजी": "Amaranth", "चाकवत": "Taro",
  "कंद": "Elephant Foot Yam", "सुरण": "Sweet Potato", "रताळी": "Yam",
  "कढीपत्ता": "Curry Leaves", "पुदिना": "Mint", "शेवगा": "Drumstick",
  "सॅलड": "Lettuce", "ब्रोकोली": "Broccoli", "चायना कोबी": "Chinese Cabbage",
  "पोकचा": "Bok Choy", "आईसबर्ग": "Iceberg", "शहाळे": "Coconut"
};

function translateCrop(marathiName: string): string {
  return CROP_TRANSLATION[marathiName] || marathiName;
}

function parsePrice(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseArgs(): { date: string; apmc?: string; all: boolean } {
  const args = process.argv.slice(2);
  const params: { date: string; apmc?: string; all: boolean } = { 
    date: getTodayDate(), 
    all: false 
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--date":
      case "-d":
        params.date = args[++i];
        break;
      case "--apmc":
      case "-a":
        params.apmc = args[++i];
        break;
      case "--all":
      case "-all":
        params.all = true;
        break;
      case "--help":
      case "-h":
        console.log(`
MSAMB Parser
Scrapes Maharashtra market prices from MSAMB API.

Usage:
  bun run scripts/msamb/index.ts [options]

Options:
  --date, -d      Date in DD/MM/YYYY format [default: today]
  --apmc, -a      APMC code (e.g., 022 for Pune)
  --all, -all     Scrape all APMCs
  -h, --help      Show this help

Examples:
  bun run scripts/msamb/index.ts -d 01/03/2026
  bun run scripts/msamb/index.ts -a 022 -d 01/03/2026
  bun run scripts/msamb/index.ts -all -d 28/02/2026
        `);
        process.exit(0);
    }
  }
  return params;
}

interface MSAMBRawRecord {
  cropName: string;
  variety: string;
  unit: string;
  minPrice: string;
  maxPrice: string;
  modalPrice: string;
  arrival: string;
  date: string;
}

function parseHTMLTable(html: string): MSAMBRawRecord[] {
  const records: MSAMBRawRecord[] = [];
  
  const dateRegex = /<td colspan="7">\s*(\d{2}\/\d{2}\/\d{4})\s*<\/td>/gi;
  const trRegex = /<tr>([\s\S]*?)<\/tr>/gi;
  
  let currentDate = "";
  let match;
  
  while ((match = trRegex.exec(html)) !== null) {
    const tr = match[1];
    
    const dateMatch = tr.match(/<td colspan="7">\s*(\d{2}\/\d{2}\/\d{4})\s*<\/td>/);
    if (dateMatch) {
      currentDate = dateMatch[1];
      continue;
    }
    
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;
    
    while ((cellMatch = tdRegex.exec(tr)) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, "").trim());
    }
    
    if (cells.length >= 6 && currentDate) {
      records.push({
        cropName: cells[0],
        variety: cells[1],
        unit: cells[2],
        minPrice: cells[3],
        maxPrice: cells[4],
        modalPrice: cells[5],
        arrival: cells[6] || "",
        date: currentDate,
      });
    }
  }
  
  return records;
}

let englishCookie = "";

async function setEnglishLanguage() {
  const baseUrl = "https://www.msamb.com/ApmcDetail/APMCPriceInformation";
  
  await fetch(baseUrl, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  
  const langRes = await fetch("https://www.msamb.com/Home/ChangeLanguage", {
    method: "POST",
    headers: { 
      "User-Agent": "Mozilla/5.0",
      "Content-Type": "application/x-www-form-urlencoded",
      "Referer": baseUrl,
      "X-Requested-With": "XMLHttpRequest"
    },
    body: "type=E"
  });
  
  englishCookie = langRes.headers.get("set-cookie") || "";
}

async function fetchAPMC(apmcCode: string, apmcName: string): Promise<Price[]> {
  const url = `https://www.msamb.com/ApmcDetail/DataGridBind?commodityCode=null&apmcCode=${apmcCode}`;
  
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:148.0) Gecko/20100101 Firefox/148.0",
      "Accept": "*/*",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": "https://www.msamb.com/ApmcDetail/APMCPriceInformation",
      "Cookie": englishCookie
    },
  });
  
  const html = await res.text();
  const records = parseHTMLTable(html);
  
  return records.map((r) => {
    const dateParts = r.date.split("/");
    const isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    
    return {
      cropName: r.cropName,
      mandiName: apmcName,
      date: isoDate,
      minPrice: parsePrice(r.minPrice),
      maxPrice: parsePrice(r.maxPrice),
      modalPrice: parsePrice(r.modalPrice),
      unit: r.unit,
      arrival: parsePrice(r.arrival) || undefined,
      source: "msamb",
    };
  });
}

const APMC_LIST = [
  { code: "086", name: "AAMGAON" },{ code: "283", name: "AARNI" },{ code: "079", name: "ACHALPUR" },
  { code: "007", name: "AHILYANAGAR" },{ code: "184", name: "AHMEDPUR" },{ code: "209", name: "AKHADABALAPUR" },
  { code: "001", name: "AKLUJ" },{ code: "010", name: "AKOLA" },{ code: "01001", name: "AKOLA (Borgaon Manju)" },
  { code: "030", name: "AKOLE" },{ code: "127", name: "ALIBAG" },{ code: "061", name: "AMALNER" },
  { code: "178", name: "AMBEJOGAI" },{ code: "012", name: "AMRAVATI" },{ code: "01201", name: "AMRAVATI-FRUIT AND VEGETABLES" },
  { code: "080", name: "ANAJNGAON SURJI" },{ code: "046", name: "ARMORI" },{ code: "04601", name: "ARMORI-DESAIGANJ" },
  { code: "027", name: "ARVI" },{ code: "269", name: "ASHTI (Wardha)" },{ code: "163", name: "ATPADI" },
  { code: "188", name: "AURAD SHAHAJANI" },{ code: "185", name: "AUSA" },{ code: "243", name: "BABHULGAON" },
  { code: "310", name: "BADNAPUR" },{ code: "217", name: "BALAPUR" },{ code: "004", name: "BARAMATI" },
  { code: "00402", name: "BARAMATI-JALOCHI" },{ code: "031", name: "BARSHI" },{ code: "218", name: "BARSHI TAKLI" },
  { code: "03101", name: "BARSHI-VAIRAG" },{ code: "210", name: "BASMAT" },{ code: "048", name: "BEED" },
  { code: "258", name: "BHADRAWATI" },{ code: "245", name: "BHANDARA" },{ code: "134", name: "BHIVANDI" },
  { code: "262", name: "BHIWAPUR" },{ code: "072", name: "BHOKARDAN" },{ code: "07201", name: "BHOKARDAN-PIMPALGAON RENU" },
  { code: "158", name: "BHOR" },{ code: "149", name: "BHUSAVAL" },{ code: "233", name: "BORI ARAB" },
  { code: "251", name: "BRAHMPURI" },{ code: "231", name: "BULDHANA" },{ code: "23101", name: "BULDHANA-DHAD" },
  { code: "187", name: "CHAKUR" },{ code: "062", name: "CHALISGAON" },{ code: "06201", name: "CHALISGAON-NAGADROAD" },
  { code: "261", name: "CHAMORSHI" },{ code: "039", name: "CHANDRAPUR" },{ code: "03901", name: "CHANDRAPUR-GANJWAD" },
  { code: "065", name: "CHANDVAD" },{ code: "035", name: "CHHATRAPATI SAMBHAJINAGAR" },{ code: "028", name: "CHIKHALI" },
  { code: "252", name: "CHIMUR" },{ code: "025", name: "CHOPDA" },{ code: "121", name: "DEULGAON RAJA" },
  { code: "286", name: "DEVALA" },{ code: "298", name: "DEVANI" },{ code: "148", name: "DHADGAON" },
  { code: "059", name: "DHAMANGAON-RLY" },{ code: "151", name: "DHARANGAON" },{ code: "018", name: "DHARASHIV" },
  { code: "223", name: "DHARNI" },{ code: "014", name: "DHULE" },{ code: "15601", name: "DINDORI-VANI" },
  { code: "023", name: "DONDAICHA" },{ code: "159", name: "DOUND" },{ code: "15901", name: "DOUND-KEDGAON" },
  { code: "15902", name: "DOUND-YAWAT" },{ code: "293", name: "DUDHANI" },{ code: "013", name: "GADCHIROLI" },
  { code: "113", name: "GANGAKHED" },{ code: "174", name: "GANGAPUR" },{ code: "109", name: "GEVRAI" },
  { code: "235", name: "GHATANJI" },{ code: "154", name: "GHOTI" },{ code: "054", name: "GONDIYA" },
  { code: "257", name: "GONDPIMPRI" },{ code: "190", name: "HADGAON" },{ code: "19001", name: "HADGAON-TAMSA" },
  { code: "198", name: "HIMAYATNAGAR" },{ code: "038", name: "HINGANGHAT" },{ code: "295", name: "HINGNA" },
  { code: "075", name: "HINGOLI" },{ code: "07501", name: "HINGOLI-KANEGAON NAKA" },{ code: "103", name: "INDAPUR" },
  { code: "10302", name: "INDAPUR (NIMGAON KETKI)" },{ code: "101", name: "ISLAMPUR" },{ code: "296", name: "JAFRABAD" },
  { code: "016", name: "JALGAON" },{ code: "01601", name: "JALGAON-MASAWAT" },{ code: "009", name: "JALNA" },
  { code: "089", name: "JAMKHED" },{ code: "076", name: "JINTUR" },{ code: "033", name: "JUNNAR" },
  { code: "03303", name: "JUNNAR (ALEPHATA)" },{ code: "03304", name: "JUNNAR (BHLHE)" },{ code: "03302", name: "JUNNAR (NARAYANGAON)" },
  { code: "03301", name: "JUNNAR-OTUR" },{ code: "204", name: "KALAMB (Dharashiv)" },{ code: "282", name: "KALAMB (Yawatmal)" },
  { code: "263", name: "KALMESHWAR" },{ code: "053", name: "KALVAN" },{ code: "102", name: "KALYAN" },
  { code: "294", name: "KAMTHI" },{ code: "191", name: "KANDHAR" },{ code: "175", name: "KANNAD" },
  { code: "105", name: "KARAD" },{ code: "077", name: "KARANJA" },{ code: "141", name: "KARJAT (A- Nagar)" },
  { code: "244", name: "KARJAT (Raigad)" },{ code: "14102", name: "KARJAT-MIRAJGAON" },{ code: "14101", name: "KARJAT-RASHIN" },
  { code: "107", name: "KARMALA" },{ code: "264", name: "KATOL" },{ code: "182", name: "KEJ" },
  { code: "082", name: "KHAMGAON" },{ code: "067", name: "KHED" },{ code: "06701", name: "KHED-CHAKAN" },
  { code: "179", name: "KILLE DHARUR" },{ code: "002", name: "KOLHAPUR" },{ code: "00201", name: "KOLHAPUR-LAXMIPURI" },
  { code: "091", name: "KOPARGAON" },{ code: "09101", name: "KOPARGAON-SHIRASGAON TILWANI" },{ code: "167", name: "KOREGAON" },
  { code: "275", name: "KORPANA" },{ code: "17101", name: "KURDWADI-MODNIMB" },{ code: "015", name: "LASALGAON" },
  { code: "01501", name: "LASALGAON-NIPHAD" },{ code: "01502", name: "LASALGAON-VINCHUR" },{ code: "108", name: "LASUR STATION" },
  { code: "005", name: "LATUR" },{ code: "00501", name: "LATUR-MURUD" },{ code: "193", name: "LOHA" },
  { code: "069", name: "LONAND" },{ code: "122", name: "LONAR" },{ code: "129", name: "MAHAD" },
  { code: "236", name: "MAHAGAON" },{ code: "037", name: "MAJALGAON" },{ code: "024", name: "MALEGAON" },
  { code: "02402", name: "MALEGAON-MUNGSE" },{ code: "083", name: "MALKAPUR" },{ code: "068", name: "MANCHAR" },
  { code: "06801", name: "MANCHAR- LONI" },{ code: "265", name: "MANDHAL" },{ code: "172", name: "MANGALWEDHA" },
  { code: "130", name: "MANGAON(BHADAV)" },{ code: "219", name: "MANGRULPEER" },{ code: "21901", name: "MANGRULPEER- SHELUBAZAR" },
  { code: "066", name: "MANMAD" },{ code: "220", name: "MANORA" },{ code: "238", name: "MAREGAON" },
  { code: "306", name: "MAUDA" },{ code: "123", name: "MEHKAR" },{ code: "173", name: "MOHOL" },
  { code: "224", name: "MORSHI" },{ code: "253", name: "MUL" },{ code: "050", name: "MUMBAI" },
  { code: "05002", name: "MUMBAI-FRUIT MARKET" },{ code: "05003", name: "MUMBAI-ONION AND POTATO MKT" },{ code: "135", name: "MURBAD" },
  { code: "078", name: "MURTIZAPUR" },{ code: "131", name: "MURUD" },{ code: "205", name: "MURUM" },
  { code: "254", name: "NAGBHID" },{ code: "034", name: "NAGPUR" },{ code: "196", name: "NAIGAON" },
  { code: "307", name: "NAMPUR" },{ code: "30701", name: "NAMPUR- KARANJAD" },{ code: "036", name: "NANDED" },
  { code: "155", name: "NANDGAON" },{ code: "225", name: "NANDGAON KHANDESHWAR" },{ code: "228", name: "NANDURA" },
  { code: "040", name: "NANDURBAR" },{ code: "266", name: "NARKHED" },{ code: "011", name: "NASHIK" },
  { code: "01101", name: "NASHIK-DEVLALI" },{ code: "239", name: "NER PARASOPANT" },{ code: "093", name: "NEWASA" },
  { code: "09301", name: "NEWASA-GHODEGAON" },{ code: "064", name: "PACHORA" },{ code: "056", name: "PAITHAN" },
  { code: "136", name: "PALGHAR(BEVUR)" },{ code: "278", name: "PALUS" },{ code: "029", name: "PANDHARPUR" },
  { code: "043", name: "PANVEL" },{ code: "206", name: "PARANDA" },{ code: "110", name: "PARLI-VAIJNATH" },
  { code: "142", name: "PARNER" },{ code: "152", name: "PAROLA" },{ code: "268", name: "PARSHIWANI" },
  { code: "112", name: "PARTUR" },{ code: "055", name: "PATAN" },{ code: "143", name: "PATHARDI" },
  { code: "181", name: "PATODA" },{ code: "132", name: "PEN" },{ code: "106", name: "PHALTAN" },
  { code: "09604", name: "PIMPALGAON (B)-AURANGPUR BHENDALI" },{ code: "09602", name: "PIMPALGAON (B)-PALKHED" },
  { code: "09601", name: "PIMPALGAON (B)-SAYKHEDA" },{ code: "096", name: "PIMPALGAON BASAWANT" },
  { code: "299", name: "POMBHURNI" },{ code: "270", name: "PULGAON" },{ code: "022", name: "PUNE" },
  { code: "02201", name: "PUNE-KHADKI" },{ code: "02204", name: "PUNE-MANJRI" },{ code: "02205", name: "PUNE-MOSHI" },
  { code: "02202", name: "PUNE-PIMPRI" },{ code: "045", name: "PUSAD" },{ code: "290", name: "RAHATA" },
  { code: "042", name: "RAHURI" },{ code: "04201", name: "RAHURI-VAMBORI" },{ code: "255", name: "RAJURA" },
  { code: "241", name: "RALEGAON" },{ code: "267", name: "RAMTEK" },{ code: "052", name: "RATANAGARI" },
  { code: "116", name: "RISOD" },{ code: "133", name: "ROHA" },{ code: "115", name: "SAILU" },
  { code: "272", name: "SAMUDRAPUR" },{ code: "017", name: "SANGALI" },{ code: "060", name: "SANGAMNER" },
  { code: "01702", name: "SANGLI-MIRAJ" },{ code: "01701", name: "SANGLI-PHALE BHAJI PALA MRKT" },{ code: "070", name: "SANGOLA" },
  { code: "090", name: "SATANA" },{ code: "168", name: "SATARA" },{ code: "259", name: "SAVALI" },
  { code: "088", name: "SAVNER" },{ code: "211", name: "SENGAON" },{ code: "020", name: "SHAHADA" },
  { code: "137", name: "SHAHAPUR" },{ code: "230", name: "SHEGAON" },{ code: "098", name: "SHEVGAON" },
  { code: "09801", name: "SHEVGAON-BODHEGAON" },{ code: "099", name: "SHIRPUR" },{ code: "16103", name: "SHIRUR-ONION MARKET" },
  { code: "094", name: "SHRIGONDA" },{ code: "095", name: "SHRIRAMPUR" },{ code: "09501", name: "SHRIRAMPUR-BELAPUR" },
  { code: "071", name: "SILLOD" },{ code: "256", name: "SINDEVAHI" },{ code: "271", name: "SINDI" },
  { code: "27101", name: "SINDI (SELU)" },{ code: "041", name: "SINNER" },{ code: "04102", name: "SINNER-DODI BUDRUK" },
  { code: "04103", name: "SINNER-NAIGAON" },{ code: "04101", name: "SINNER-NANDUR SHINGOTE" },
  { code: "003", name: "SOLAPUR" },{ code: "287", name: "SONPETH" },{ code: "164", name: "TASGAON" },
  { code: "248", name: "TIRODA" },{ code: "207", name: "TULJAPUR" },{ code: "125", name: "TUMSAR" },
  { code: "139", name: "ULHASNAGAR" },{ code: "058", name: "UMARED" },{ code: "242", name: "UMARKHED" },
  { code: "24201", name: "UMARKHED-DANKI" },{ code: "097", name: "VADGAON PETH" },{ code: "169", name: "VADUJ" },
  { code: "292", name: "VADVANI" },{ code: "170", name: "VAI" },{ code: "177", name: "VAIJAPUR" },
  { code: "17701", name: "VAIJAPUR- SHIUR" },{ code: "085", name: "VANI" },{ code: "08501", name: "VANI- SHINDOLA" },
  { code: "126", name: "VARORA" },{ code: "12603", name: "VARORA - KHAMBADA" },{ code: "12601", name: "VARORA-MADHELI" },
  { code: "12602", name: "VARORA-SHEGAON" },{ code: "120", name: "VARUD" },{ code: "12001", name: "VARUD-RAJURA BAZAR" },
  { code: "138", name: "VASAI" },{ code: "165", name: "VITA" },{ code: "063", name: "WARDHA" },
  { code: "049", name: "WASHIM" },{ code: "04901", name: "WASHIM-ANSING" },{ code: "008", name: "YEOLA" },
  { code: "00801", name: "YEOLA-AANDARSUL" },{ code: "019", name: "YEOTMAL" }
];

async function scrapeAll(date: string): Promise<Price[]> {
  const allPrices: Price[] = [];
  
  console.log(`Scraping ${APMC_LIST.length} APMCs...`);
  
  const batchSize = 10;
  for (let i = 0; i < APMC_LIST.length; i += batchSize) {
    const batch = APMC_LIST.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(apmc => fetchAPMC(apmc.code, apmc.name)));
    
    for (const prices of results) {
      const validated = prices.map(p => PriceSchema.parse(p));
      allPrices.push(...validated);
    }
    
    console.log(`  Processed ${Math.min(i + batchSize, APMC_LIST.length)}/${APMC_LIST.length}, found ${allPrices.length} records...`);
  }
  
  console.log(`Total records: ${allPrices.length}`);
  return allPrices;
}

async function main() {
  const args = parseArgs();
  const inputDate = args.date.includes("/") ? args.date : args.date.split("-").reverse().join("/");
  
  console.log(`MSAMB scraper for date: ${inputDate}`);
  console.log("Setting English language...");
  await setEnglishLanguage();
  
  try {
    let prices: Price[];
    
    if (args.all) {
      prices = await scrapeAll(inputDate);
    } else if (args.apmc) {
      const apmc = APMC_LIST.find(a => a.code === args.apmc);
      prices = await fetchAPMC(args.apmc, apmc?.name || args.apmc);
      prices = prices.map(p => PriceSchema.parse(p));
    } else {
      console.log("APMC List (first 10):");
      console.log(APMC_LIST.slice(0, 10));
      console.log(`\nTotal APMCs: ${APMC_LIST.length}`);
      console.log("\nUsage: bun run scripts/msamb/index.ts -a 022 -d 28/02/2026");
      return;
    }
    
    const outputPath = `./data/msamb/${args.date.replace(/\//g, "-")}.json`;
    await Bun.write(outputPath, JSON.stringify(prices, null, 2));
    console.log(`Saved ${prices.length} records to ${outputPath}`);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
