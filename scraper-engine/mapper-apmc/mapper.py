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


def get_sources():
    sources = set()
    if not PARSER_DIR.exists():
        return sources
    for src_dir in PARSER_DIR.iterdir():
        if src_dir.is_dir():
            sources.add(src_dir.name)
    return sources


def get_mandis_by_source(source):
    mandis_by_source = defaultdict(set)
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
                                name = item["mandiName"]
                                mandis_by_source[source].add(name)
                                mandis_by_source[source].add(name.lower())
            except Exception as e:
                print(f"Error reading {file}: {e}")
    return mandis_by_source


def create_source_map(mandi_lookup, mandis_by_source):
    source_map = {}
    for source, mandi_names in mandis_by_source.items():
        source_map[source] = {}
        for name in mandi_names:
            if name in mandi_lookup:
                source_map[source][name] = mandi_lookup[name]
    return source_map


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
        mandis_by_source = get_mandis_by_source(source)
        all_mandis_by_source[source] = mandis_by_source[source] if source in mandis_by_source else set()
        print(f"  {source}: {len(all_mandis_by_source[source])} unique mandi names")

    print("Creating source maps...")
    source_map = create_source_map(mandi_lookup, all_mandis_by_source)

    MAPPER_DIR.mkdir(parents=True, exist_ok=True)
    
    for source, mappings in source_map.items():
        output_file = MAPPER_DIR / f"{source}.json"
        with open(output_file, "w") as f:
            json.dump(mappings, f, indent=2)
        print(f"Saved {source}.json with {len(mappings)} mappings")

    print("\nDone!")


if __name__ == "__main__":
    main()
