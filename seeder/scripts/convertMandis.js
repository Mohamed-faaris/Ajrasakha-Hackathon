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

function convertMandis(inputPath, outputPath, stateCodeMapPath) {
  const sourceData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const stateCodeMap = JSON.parse(fs.readFileSync(stateCodeMapPath, 'utf8'));

  const stateIdToCode = {};
  const stateIdToName = {};
  
  sourceData.data.state_data
    .filter(s => s.state_id !== 100000)
    .forEach(s => {
      stateIdToCode[s.state_id] = stateCodeMap[s.state_name];
      stateIdToName[s.state_id] = s.state_name;
    });

  const districtIdToName = {};
  const districtIdToStateId = {};
  
  sourceData.data.district_data
    .filter(d => d.id !== 100001)
    .forEach(d => {
      districtIdToName[d.id] = d.district_name;
      districtIdToStateId[d.id] = d.state_id;
    });

  const mandis = sourceData.data.market_data
    .filter(m => m.id !== 100002 && m.state_id !== null)
    .map(m => {
      const stateCode = stateIdToCode[m.state_id] || 'XX';
      const stateName = stateIdToName[m.state_id] || 'Unknown';
      const districtName = districtIdToName[m.district_id] || 'Unknown';
      const districtSlug = generateSlug(districtName);
      const mandiSlug = generateSlug(m.mkt_name);
      
      return {
        _id: `${stateCode.toLowerCase()}-${districtSlug}-${mandiSlug}`,
        name: m.mkt_name.toUpperCase().trim(),
        stateId: stateCode,
        stateName: stateName.toUpperCase(),
        districtId: districtSlug,
        districtName: districtName.toUpperCase(),
        sourceMandiId: String(m.id),
      };
    });

  const uniqueIds = new Set();
  const duplicates = [];
  const finalMandis = [];

  for (const mandi of mandis) {
    let id = mandi._id;
    if (uniqueIds.has(id)) {
      duplicates.push(id);
      id = `${id}-${mandi.sourceMandiId}`;
    }
    uniqueIds.add(id);
    mandi._id = id;
    finalMandis.push(mandi);
  }

  fs.writeFileSync(outputPath, JSON.stringify(finalMandis, null, 2));

  console.log(`Converted ${finalMandis.length} mandis`);
  console.log(`Output: ${outputPath}`);
  
  if (duplicates.length > 0) {
    console.log(`Resolved ${duplicates.length} duplicate IDs`);
  }

  return finalMandis;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node convertMandis.js <input.json> <output.json> [stateCodeMap.json]');
    console.log('Example: node convertMandis.js data.json mandis.converted.json stateCodeMap.json');
    process.exit(1);
  }

  const [inputPath, outputPath, stateCodeMapPath] = args;
  const stateMapPath = stateCodeMapPath || path.join(__dirname, '../data/stateCodeMap.json');
  
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(stateMapPath)) {
    console.error(`Error: State code map not found: ${stateMapPath}`);
    process.exit(1);
  }

  convertMandis(inputPath, outputPath, stateMapPath);
}

main();
