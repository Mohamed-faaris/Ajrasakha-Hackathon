import type { State, CropPrice, CropInfo, Mandi, ArbitrageOpportunity, StateCoverage, TopMover, PriceTrend, DataSource } from "./types";

export const states: State[] = [
  { code: "AP", name: "Andhra Pradesh" },
  { code: "BR", name: "Bihar" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "OD", name: "Odisha" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TS", name: "Telangana" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UK", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
];

export const crops: CropInfo[] = [
  { name: "Wheat", category: "Cereals", mspPrice: 2275 },
  { name: "Rice (Paddy)", category: "Cereals", mspPrice: 2300 },
  { name: "Maize", category: "Cereals", mspPrice: 2090 },
  { name: "Bajra", category: "Cereals", mspPrice: 2500 },
  { name: "Jowar", category: "Cereals", mspPrice: 3180 },
  { name: "Barley", category: "Cereals", mspPrice: 1850 },
  { name: "Potato", category: "Vegetables" },
  { name: "Onion", category: "Vegetables" },
  { name: "Tomato", category: "Vegetables" },
  { name: "Cauliflower", category: "Vegetables" },
  { name: "Cabbage", category: "Vegetables" },
  { name: "Brinjal", category: "Vegetables" },
  { name: "Lady Finger", category: "Vegetables" },
  { name: "Green Peas", category: "Vegetables" },
  { name: "Capsicum", category: "Vegetables" },
  { name: "Carrot", category: "Vegetables" },
  { name: "Bitter Gourd", category: "Vegetables" },
  { name: "Bottle Gourd", category: "Vegetables" },
  { name: "Apple", category: "Fruits" },
  { name: "Banana", category: "Fruits" },
  { name: "Mango", category: "Fruits" },
  { name: "Grapes", category: "Fruits" },
  { name: "Orange", category: "Fruits" },
  { name: "Pomegranate", category: "Fruits" },
  { name: "Guava", category: "Fruits" },
  { name: "Papaya", category: "Fruits" },
  { name: "Chana (Gram)", category: "Pulses", mspPrice: 5440 },
  { name: "Tur (Arhar)", category: "Pulses", mspPrice: 7000 },
  { name: "Moong", category: "Pulses", mspPrice: 8558 },
  { name: "Urad", category: "Pulses", mspPrice: 6950 },
  { name: "Masoor", category: "Pulses", mspPrice: 6425 },
  { name: "Groundnut", category: "Oilseeds", mspPrice: 6377 },
  { name: "Mustard", category: "Oilseeds", mspPrice: 5650 },
  { name: "Soybean", category: "Oilseeds", mspPrice: 4600 },
  { name: "Sunflower", category: "Oilseeds", mspPrice: 6760 },
  { name: "Cotton", category: "Cash Crops", mspPrice: 7020 },
  { name: "Sugarcane", category: "Cash Crops", mspPrice: 315 },
  { name: "Jute", category: "Cash Crops", mspPrice: 5050 },
  { name: "Turmeric", category: "Spices" },
  { name: "Red Chilli", category: "Spices" },
  { name: "Coriander", category: "Spices" },
  { name: "Cumin", category: "Spices" },
  { name: "Ginger", category: "Spices" },
  { name: "Garlic", category: "Spices" },
  { name: "Black Pepper", category: "Spices" },
  { name: "Cardamom", category: "Spices" },
];

const sources: DataSource[] = ["eNAM", "Agmarknet", "State Portal"];

const mandiNames = [
  "Azadpur", "Vashi", "Koyambedu", "Yeshwanthpur", "Bowenpally",
  "Gultekdi", "Devi Ahilya Bai Holkar", "Karnal", "Khanna", "Rajkot",
  "Lasalgaon", "Ahmednagar", "Nagpur", "Indore", "Bhopal",
  "Lucknow", "Kanpur", "Varanasi", "Patna", "Ranchi",
  "Siliguri", "Guwahati", "Jaipur", "Jodhpur", "Kota",
];

const districts = [
  "North Delhi", "Thane", "Chennai", "Bangalore Urban", "Hyderabad",
  "Pune", "Indore", "Karnal", "Ludhiana", "Rajkot",
  "Nashik", "Ahmednagar", "Nagpur", "Indore", "Bhopal",
  "Lucknow", "Kanpur Nagar", "Varanasi", "Patna", "Ranchi",
  "Darjeeling", "Kamrup", "Jaipur", "Jodhpur", "Kota",
];

export const mandis: Mandi[] = mandiNames.map((name, i) => ({
  id: `mandi-${i + 1}`,
  name,
  district: districts[i],
  stateCode: states[i % states.length].code,
  isEnamIntegrated: i < 15,
  source: i < 10 ? "eNAM" : i < 18 ? "Agmarknet" : "State Portal",
  lastUpdated: new Date().toISOString().split("T")[0],
}));

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

const priceRanges: Record<string, [number, number]> = {
  Wheat: [2000, 2800], "Rice (Paddy)": [2100, 3200], Maize: [1800, 2600],
  Potato: [800, 2500], Onion: [1000, 4000], Tomato: [600, 5000],
  Cauliflower: [500, 2000], Cabbage: [400, 1500], Brinjal: [800, 2500],
  Apple: [5000, 12000], Banana: [1500, 4000], Mango: [3000, 10000],
  "Chana (Gram)": [4500, 6500], "Tur (Arhar)": [6000, 9000],
  Groundnut: [5000, 8000], Mustard: [4500, 7000], Soybean: [3800, 5500],
  Cotton: [6000, 8500], Sugarcane: [280, 400],
  Turmeric: [8000, 16000], "Red Chilli": [10000, 25000],
  Cumin: [25000, 45000], "Black Pepper": [40000, 65000],
};

export const cropPrices: CropPrice[] = [];
let priceId = 0;

// Generate prices for each mandi × subset of crops
mandis.forEach((mandi) => {
  const cropSubset = crops.filter(() => Math.random() > 0.6).slice(0, 12);
  cropSubset.forEach((crop) => {
    const range = priceRanges[crop.name] || [1000, 5000];
    const modal = rand(range[0], range[1]);
    const minP = Math.round(modal * (0.8 + Math.random() * 0.1));
    const maxP = Math.round(modal * (1.05 + Math.random() * 0.15));
    cropPrices.push({
      id: `price-${++priceId}`,
      date: new Date().toISOString().split("T")[0],
      stateCode: mandi.stateCode,
      state: states.find((s) => s.code === mandi.stateCode)!.name,
      district: mandi.district,
      mandi: mandi.name,
      crop: crop.name,
      variety: "Local",
      minPrice: minP,
      maxPrice: maxP,
      modalPrice: modal,
      unit: "₹/Quintal",
      source: mandi.source,
    });
  });
});

export const topMovers: TopMover[] = [
  { crop: "Tomato", state: "Maharashtra", changePercent: 18.5, currentPrice: 3200, previousPrice: 2700, direction: "up" },
  { crop: "Onion", state: "Maharashtra", changePercent: 15.2, currentPrice: 3800, previousPrice: 3300, direction: "up" },
  { crop: "Potato", state: "Uttar Pradesh", changePercent: -12.3, currentPrice: 1200, previousPrice: 1369, direction: "down" },
  { crop: "Wheat", state: "Punjab", changePercent: 5.8, currentPrice: 2450, previousPrice: 2316, direction: "up" },
  { crop: "Rice (Paddy)", state: "West Bengal", changePercent: -8.1, currentPrice: 2500, previousPrice: 2720, direction: "down" },
  { crop: "Cumin", state: "Rajasthan", changePercent: 22.4, currentPrice: 38000, previousPrice: 31045, direction: "up" },
  { crop: "Mustard", state: "Haryana", changePercent: -6.5, currentPrice: 5200, previousPrice: 5561, direction: "down" },
  { crop: "Cotton", state: "Gujarat", changePercent: 4.2, currentPrice: 7200, previousPrice: 6910, direction: "up" },
];

export const stateCoverage: StateCoverage[] = [
  { stateCode: "MH", state: "Maharashtra", totalApmcs: 506, enamIntegrated: 118, statePortal: 320, uncovered: 68, avgPrice: 2800 },
  { stateCode: "UP", state: "Uttar Pradesh", totalApmcs: 680, enamIntegrated: 200, statePortal: 350, uncovered: 130, avgPrice: 2200 },
  { stateCode: "MP", state: "Madhya Pradesh", totalApmcs: 549, enamIntegrated: 180, statePortal: 280, uncovered: 89, avgPrice: 2500 },
  { stateCode: "RJ", state: "Rajasthan", totalApmcs: 495, enamIntegrated: 144, statePortal: 260, uncovered: 91, avgPrice: 2600 },
  { stateCode: "GJ", state: "Gujarat", totalApmcs: 410, enamIntegrated: 122, statePortal: 220, uncovered: 68, avgPrice: 2900 },
  { stateCode: "KA", state: "Karnataka", totalApmcs: 352, enamIntegrated: 108, statePortal: 195, uncovered: 49, avgPrice: 3100 },
  { stateCode: "TN", state: "Tamil Nadu", totalApmcs: 290, enamIntegrated: 80, statePortal: 170, uncovered: 40, avgPrice: 3200 },
  { stateCode: "AP", state: "Andhra Pradesh", totalApmcs: 330, enamIntegrated: 95, statePortal: 190, uncovered: 45, avgPrice: 2700 },
  { stateCode: "PB", state: "Punjab", totalApmcs: 345, enamIntegrated: 75, statePortal: 230, uncovered: 40, avgPrice: 2400 },
  { stateCode: "HR", state: "Haryana", totalApmcs: 284, enamIntegrated: 82, statePortal: 165, uncovered: 37, avgPrice: 2350 },
  { stateCode: "TS", state: "Telangana", totalApmcs: 265, enamIntegrated: 72, statePortal: 155, uncovered: 38, avgPrice: 2650 },
  { stateCode: "WB", state: "West Bengal", totalApmcs: 395, enamIntegrated: 45, statePortal: 250, uncovered: 100, avgPrice: 2100 },
  { stateCode: "BR", state: "Bihar", totalApmcs: 310, enamIntegrated: 35, statePortal: 180, uncovered: 95, avgPrice: 1900 },
  { stateCode: "OD", state: "Odisha", totalApmcs: 260, enamIntegrated: 40, statePortal: 155, uncovered: 65, avgPrice: 2000 },
  { stateCode: "KL", state: "Kerala", totalApmcs: 120, enamIntegrated: 18, statePortal: 80, uncovered: 22, avgPrice: 3800 },
  { stateCode: "JH", state: "Jharkhand", totalApmcs: 180, enamIntegrated: 20, statePortal: 100, uncovered: 60, avgPrice: 1850 },
  { stateCode: "HP", state: "Himachal Pradesh", totalApmcs: 95, enamIntegrated: 22, statePortal: 55, uncovered: 18, avgPrice: 3500 },
  { stateCode: "UK", state: "Uttarakhand", totalApmcs: 80, enamIntegrated: 18, statePortal: 45, uncovered: 17, avgPrice: 3000 },
  { stateCode: "MN", state: "Manipur", totalApmcs: 40, enamIntegrated: 5, statePortal: 20, uncovered: 15, avgPrice: 2800 },
  { stateCode: "ML", state: "Meghalaya", totalApmcs: 35, enamIntegrated: 3, statePortal: 18, uncovered: 14, avgPrice: 2900 },
];

export const arbitrageOpportunities: ArbitrageOpportunity[] = [
  { crop: "Tomato", variety: "Local", mandiA: "Koyambedu", stateA: "Tamil Nadu", priceA: 1800, mandiB: "Azadpur", stateB: "Delhi", priceB: 3200, priceDiff: 1400, distanceKm: 2200 },
  { crop: "Onion", variety: "Nashik Red", mandiA: "Lasalgaon", stateA: "Maharashtra", priceA: 2500, mandiB: "Vashi", stateB: "Maharashtra", priceB: 3800, priceDiff: 1300, distanceKm: 180 },
  { crop: "Potato", variety: "Jyoti", mandiA: "Agra", stateA: "Uttar Pradesh", priceA: 900, mandiB: "Yeshwanthpur", stateB: "Karnataka", priceB: 2100, priceDiff: 1200, distanceKm: 1500 },
  { crop: "Apple", variety: "Royal Delicious", mandiA: "Shimla", stateA: "Himachal Pradesh", priceA: 6500, mandiB: "Bowenpally", stateB: "Telangana", priceB: 11000, priceDiff: 4500, distanceKm: 1800 },
  { crop: "Wheat", variety: "Sharbati", mandiA: "Khanna", stateA: "Punjab", priceA: 2200, mandiB: "Gultekdi", stateB: "Maharashtra", priceB: 2800, priceDiff: 600, distanceKm: 1600 },
  { crop: "Turmeric", variety: "Erode", mandiA: "Koyambedu", stateA: "Tamil Nadu", priceA: 9500, mandiB: "Azadpur", stateB: "Delhi", priceB: 14500, priceDiff: 5000, distanceKm: 2200 },
];

// Generate 6 months of price trend data
export function generatePriceTrend(crop: string, months = 6): PriceTrend[] {
  const range = priceRanges[crop] || [1000, 5000];
  const basePrice = (range[0] + range[1]) / 2;
  const data: PriceTrend[] = [];
  const now = new Date();

  for (let i = months * 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const seasonal = Math.sin((i / 30) * Math.PI * 0.5) * basePrice * 0.15;
    const noise = (Math.random() - 0.5) * basePrice * 0.1;
    const price = Math.round(basePrice + seasonal + noise);
    data.push({
      date: date.toISOString().split("T")[0],
      price,
      minPrice: Math.round(price * 0.88),
      maxPrice: Math.round(price * 1.12),
    });
  }
  return data;
}

export const quickStats = {
  totalApmcs: 7021,
  enamIntegrated: 1522,
  statePortalCovered: 3899,
  uncovered: 1600,
  cropsTracked: crops.length,
  todaysUpdates: cropPrices.length,
  statesCovered: states.length,
};
