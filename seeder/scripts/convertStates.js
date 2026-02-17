const fs = require('fs');
const path = require('path');

function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 20);
}

function convertStates(inputPath, outputPath, stateCodeMapPath) {
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
  
  const districtsByState = {};
  
  sourceData.data.district_data
    .filter(d => d.state_id !== null && d.state_id !== 100000)
    .forEach(d => {
      if (!districtsByState[d.state_id]) {
        districtsByState[d.state_id] = [];
      }
      districtsByState[d.state_id].push({
        _id: generateSlug(d.district_name),
        name: d.district_name.toLowerCase().trim()
      });
    });
  
  const states = sourceData.data.state_data
    .filter(s => s.state_id !== 100000)
    .map(s => ({
      _id: stateCodeMap[s.state_name],
      name: s.state_name.toLowerCase().trim(),
      districts: districtsByState[s.state_id] || []
    }));
  
  fs.writeFileSync(outputPath, JSON.stringify(states, null, 2));
  
  console.log(`Converted ${states.length} states`);
  console.log(`Output: ${outputPath}`);
  
  const totalDistricts = states.reduce((sum, s) => sum + s.districts.length, 0);
  console.log(`Total districts: ${totalDistricts}`);
  
  return states;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node convertStates.js <input.json> <output.json> [stateCodeMap.json]');
    console.log('Example: node convertStates.js data.json states.converted.json stateCodeMap.json');
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

  convertStates(inputPath, outputPath, stateMapPath);
}

main();
