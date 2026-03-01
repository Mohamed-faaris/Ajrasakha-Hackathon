const fs = require('fs');
const path = require('path');

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

function convertCrops(inputPath, outputPath) {
  const sourceData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
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

  fs.writeFileSync(outputPath, JSON.stringify(finalCrops, null, 2));

  console.log(`Converted ${finalCrops.length} crops`);
  console.log(`Output: ${outputPath}`);
  
  if (duplicates.length > 0) {
    console.log(`Resolved ${duplicates.length} duplicate slugs`);
  }

  return finalCrops;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node convertCrops.js <input.json> <output.json>');
    console.log('Example: node convertCrops.js data.json crops.converted.json');
    process.exit(1);
  }

  const [inputPath, outputPath] = args;
  
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  convertCrops(inputPath, outputPath);
}

main();
