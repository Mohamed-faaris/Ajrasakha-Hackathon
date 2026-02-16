const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '../../tmp/seed-scraper/data-tmps/crops/data.json');
const CODE_MAP_PATH = path.join(__dirname, '../data/stateCodeMap.json');
const OUTPUT_PATH = path.join(__dirname, '../data/states.converted.json');

// Generate a URL-friendly slug from district name
function generateSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20);
}

function main() {
    const sourceData = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
    const stateCodeMap = JSON.parse(fs.readFileSync(CODE_MAP_PATH, 'utf8'));
    
    // Create a map of state_id to state info
    const stateIdToCode = {};
    const stateIdToName = {};
    
    sourceData.data.state_data
        .filter(s => s.state_id !== 100000)
        .forEach(s => {
            stateIdToCode[s.state_id] = stateCodeMap[s.state_name];
            stateIdToName[s.state_id] = s.state_name;
        });
    
    // Group districts by state_id
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
    
    // Build states with their districts
    const states = sourceData.data.state_data
        .filter(s => s.state_id !== 100000)
        .map(s => ({
            _id: stateCodeMap[s.state_name],
            name: s.state_name.toLowerCase().trim(),
            districts: districtsByState[s.state_id] || []
        }));
    
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(states, null, 2));
    console.log(`Converted ${states.length} states with districts to ${OUTPUT_PATH}`);
    
    // Log stats
    const totalDistricts = states.reduce((sum, s) => sum + s.districts.length, 0);
    console.log(`Total districts: ${totalDistricts}`);
}

main();