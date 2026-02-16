const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '../../tmp/seed-scraper/data-tmps/crops/data.json');
const OUTPUT_PATH = path.join(__dirname, '../data/crops.converted.json');

const COMMODITY_GROUP_MAP = {
  1: 'Cereals',
  2: 'Pulses',
  3: 'Oilseeds',
  4: 'Fibers',
  5: 'Fruits',
  6: 'Vegetables',
  7: 'Spices',
  8: 'Nuts',
  9: 'Plantation Crops',
  10: 'Others',
  11: 'Medicinal & Aromatic',
  12: 'Minor Forest Produce',
  13: 'Livestock',
  14: 'Flowers',
  15: 'Oils & Fats',
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

function main() {
  const sourceData = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
  const cmdtData = sourceData.data.cmdt_data;

  const crops = cmdtData.map(crop => ({
    _id: generateSlug(crop.cmdt_name),
    name: crop.cmdt_name.toUpperCase().trim(),
    commodityGroup: COMMODITY_GROUP_MAP[crop.cmdt_group_id] || 'Others',
    sourceId: crop.cmdt_id,
  }));

  const uniqueIds = new Set();
  const duplicates = [];
  const finalCrops = [];

  for (const crop of crops) {
    if (uniqueIds.has(crop._id)) {
      duplicates.push(crop._id);
      crop._id = `${crop._id}-${crop.sourceId}`;
    }
    uniqueIds.add(crop._id);
    finalCrops.push(crop);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalCrops, null, 2));
  
  console.log(`Converted ${finalCrops.length} crops to ${OUTPUT_PATH}`);
  console.log(`Groups used: ${[...new Set(finalCrops.map(c => c.commodityGroup))].join(', ')}`);
  
  if (duplicates.length > 0) {
    console.log(`\nResolved ${duplicates.length} duplicate slugs by appending sourceId`);
  }

  const groupCounts = {};
  finalCrops.forEach(c => {
    groupCounts[c.commodityGroup] = (groupCounts[c.commodityGroup] || 0) + 1;
  });
  console.log('\nCrops per group:');
  Object.entries(groupCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([group, count]) => console.log(`  ${group}: ${count}`));
}

main();
