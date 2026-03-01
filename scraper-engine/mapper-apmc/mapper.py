import json
import os
from pathlib import Path
from collections import defaultdict

MANDIS_FILE = "/workspaces/Ajrasakha-Hackathon/seeder/data/mandis.converted.json"
PARSER_DIR = Path("/workspaces/Ajrasakha-Hackathon/scraper-engine/parser/data")
MAPPER_DIR = Path("/workspaces/Ajrasakha-Hackathon/scraper-engine/mapper-apmc")


def load_mandis():
    with open(MANDIS_FILE, "r") as f:
        return json.load(f)


def create_mandi_lookup(mandis):
    lookup = {}
    for mandi in mandis:
        lookup[mandi["name"]] = {
            "mandiId": mandi["_id"],
            "stateId": mandi["stateId"]
        }
        lookup[mandi["name"].lower()] = {
            "mandiId": mandi["_id"],
            "stateId": mandi["stateId"]
        }
    return lookup


def generate_mandi_id(name, state_id=None):
    name_slug = name.lower().replace(" ", "-").replace(",", "")
    return f"unknown-{state_id.lower() if state_id else 'xx'}-{name_slug}-apmc"


def get_sources():
    sources = set()
    if not PARSER_DIR.exists():
        return sources
    for src_dir in PARSER_DIR.iterdir():
        if src_dir.is_dir():
            sources.add(src_dir.name)
    return sources


def get_mandis_by_source(source):
    mandis_by_source = set()
    source_dir = PARSER_DIR / source
    if not source_dir.exists():
        return mandis_by_source
    
    for file in source_dir.iterdir():
        if file.suffix == ".json":
            try:
                with open(file, "r") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for item in data:
                            if "mandiName" in item:
                                mandis_by_source.add(item["mandiName"])
            except Exception as e:
                print(f"Error reading {file}: {e}")
    return mandis_by_source


def create_source_map(mandi_lookup, mandi_names):
    source_map = {}
    matched = 0
    new_entries = 0
    
    for name in mandi_names:
        if name in mandi_lookup:
            source_map[name] = mandi_lookup[name]
            matched += 1
        elif name.lower() in mandi_lookup:
            source_map[name] = mandi_lookup[name.lower()]
            matched += 1
        else:
            state_id = "XX"
            mandi_id = generate_mandi_id(name, state_id)
            source_map[name] = {
                "mandiId": mandi_id,
                "stateId": state_id,
                "new": True
            }
            new_entries += 1
    
    return source_map, matched, new_entries


def main():
    print("Loading mandis data...")
    mandis = load_mandis()
    print(f"Loaded {len(mandis)} mandis")

    print("Creating mandi lookup...")
    mandi_lookup = create_mandi_lookup(mandis)

    print("Finding sources...")
    sources = get_sources()
    print(f"Found sources: {sources}")

    print("Collecting mandis by source...")
    all_mandis_by_source = {}
    for source in sources:
        mandi_names = get_mandis_by_source(source)
        all_mandis_by_source[source] = mandi_names
        print(f"  {source}: {len(mandi_names)} unique mandi names")

    print("Creating source maps...")
    MAPPER_DIR.mkdir(parents=True, exist_ok=True)
    
    for source, mandi_names in all_mandis_by_source.items():
        source_map, matched, new_entries = create_source_map(mandi_lookup, mandi_names)
        
        output_file = MAPPER_DIR / f"{source}.json"
        with open(output_file, "w") as f:
            json.dump(source_map, f, indent=2)
        print(f"Saved {source}.json with {len(source_map)} mappings ({matched} matched, {new_entries} new)")

    print("\nDone!")


if __name__ == "__main__":
    main()
