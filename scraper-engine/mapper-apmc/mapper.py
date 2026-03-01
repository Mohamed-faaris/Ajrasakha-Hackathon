import json
import os
import sys
import argparse
from pathlib import Path
from sklearn.metrics.pairwise import cosine_similarity

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("sentence-transformers not installed. Installing...")
    os.system("pip install sentence-transformers scikit-learn")
    from sentence_transformers import SentenceTransformer

PARSER_DIR = Path("/workspaces/Ajrasakha-Hackathon/scraper-engine/parser/data")
MAPPER_DIR = Path("/workspaces/Ajrasakha-Hackathon/scraper-engine/mapper-apmc")
INDEX_FILE = MAPPER_DIR / "apmc-map" / "index.json"
EMBEDDINGS_FILE = MAPPER_DIR / "apmc-map" / "embeddings.json"


def load_index():
    with open(INDEX_FILE, "r") as f:
        return json.load(f)


def load_embeddings():
    with open(EMBEDDINGS_FILE, "r") as f:
        return json.load(f)


def save_index(index):
    with open(INDEX_FILE, "w") as f:
        json.dump(index, f, indent=2)


def save_embeddings(embeddings):
    with open(EMBEDDINGS_FILE, "w") as f:
        json.dump(embeddings, f, indent=2)


def get_source_mandis(source):
    mandis = set()
    source_dir = PARSER_DIR / source
    if not source_dir.exists():
        return mandis
    
    for file in source_dir.glob("*.json"):
        try:
            with open(file, "r") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if "mandiName" in item:
                            mandis.add(item["mandiName"])
        except Exception as e:
            print(f"Error reading {file}: {e}")
    return mandis


def generate_mandi_id(name, state_id=None):
    name_slug = name.lower().replace(" ", "-").replace(",", "").replace("(", "").replace(")", "")
    return f"unknown-{state_id.lower() if state_id else 'xx'}-{name_slug}-apmc"


def batch_fuzzy_match(source_mandis, index, embeddings, model, threshold=0.5):
    canonical_names = list(index.keys())
    canonical_embeddings = [embeddings[name]["embedding"] for name in canonical_names]
    
    source_list = list(source_mandis)
    source_texts = [f"{name} mandi" for name in source_list]
    source_embeddings = model.encode(source_texts, show_progress_bar=True)
    
    similarities = cosine_similarity(source_embeddings, canonical_embeddings)
    
    source_map = {}
    new_entries = []
    
    for i, mandi in enumerate(source_list):
        best_idx = similarities[i].argmax()
        best_score = similarities[i][best_idx]
        
        if best_score >= threshold:
            canonical_name = canonical_names[best_idx]
            source_map[mandi] = {
                "mandiId": index[canonical_name]["mandiId"],
                "stateId": index[canonical_name]["stateId"]
            }
        else:
            new_id = generate_mandi_id(mandi, "XX")
            index[mandi] = {
                "mandiId": new_id,
                "stateId": "XX"
            }
            embeddings[mandi] = {
                "mandiId": new_id,
                "stateId": "XX",
                "embedding": source_embeddings[i].tolist()
            }
            source_map[mandi] = {
                "mandiId": new_id,
                "stateId": "XX"
            }
            new_entries.append(mandi)
    
    return source_map, new_entries


def main():
    parser = argparse.ArgumentParser(description="Create mandi map for a data source")
    parser.add_argument("source", nargs="?", help="Source name (e.g., msamb, agmarknet, krishimaratavahini)")
    parser.add_argument("--threshold", type=float, default=0.5, help="Similarity threshold (default: 0.5)")
    args = parser.parse_args()
    
    if not args.source:
        available_sources = []
        if PARSER_DIR.exists():
            for d in PARSER_DIR.iterdir():
                if d.is_dir():
                    available_sources.append(d.name)
        print(f"Usage: python mapper.py <source>")
        print(f"Available sources: {', '.join(available_sources)}")
        return
    
    source = args.source
    source_dir = PARSER_DIR / source
    if not source_dir.exists():
        print(f"Error: Source '{source}' not found in {PARSER_DIR}")
        return
    
    print(f"Loading mandi index and embeddings...")
    index = load_index()
    embeddings = load_embeddings()
    print(f"Loaded {len(index)} canonical mandis")
    
    print(f"Collecting mandis from source: {source}...")
    source_mandis = get_source_mandis(source)
    print(f"Found {len(source_mandis)} unique mandi names")
    
    print(f"Loading model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    print(f"Performing fuzzy matching...")
    source_map, new_entries = batch_fuzzy_match(source_mandis, index, embeddings, model, threshold=args.threshold)
    
    if new_entries:
        print(f"Adding {len(new_entries)} new entries to index...")
        save_index(index)
        save_embeddings(embeddings)
        print(f"Updated index and embeddings files")
    
    matched = len(source_map) - len(new_entries)
    
    output_file = MAPPER_DIR / "apmc-map" / f"{source}.json"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w") as f:
        json.dump(source_map, f, indent=2)
    
    print(f"\nDone! Created {output_file}")
    print(f"  Total mappings: {len(source_map)}")
    print(f"  Matched: {matched}")
    print(f"  New entries added: {len(new_entries)}")


if __name__ == "__main__":
    main()
