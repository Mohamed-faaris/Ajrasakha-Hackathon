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

CROPS_FILE = "/workspaces/Ajrasakha-Hackathon/seeder/data/crops.converted.json"
PARSER_DIR = Path("/workspaces/Ajrasakha-Hackathon/scraper-engine/parser/data")
MAPPER_DIR = Path("/workspaces/Ajrasakha-Hackathon/scraper-engine/mapper")
INDEX_FILE = MAPPER_DIR / "crop-map" / "index.json"
EMBEDDINGS_FILE = MAPPER_DIR / "crop-map" / "embeddings.json"


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


def get_source_crops(source):
    crops = set()
    source_dir = PARSER_DIR / source
    if not source_dir.exists():
        return crops
    
    for file in source_dir.glob("*.json"):
        try:
            with open(file, "r") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        crop_key = "cropName" if "cropName" in item else "commodityName"
                        if crop_key in item:
                            crops.add(item[crop_key])
        except Exception as e:
            print(f"Error reading {file}: {e}")
    return crops


def generate_embedding(crop_name, model):
    text = crop_name.lower()
    embedding = model.encode([text], show_progress_bar=False)
    return embedding[0].tolist()


def batch_fuzzy_match(source_crops, index, embeddings, model, threshold=0.5):
    canonical_ids = list(index.keys())
    canonical_names = [index[crop_id]["name"] for crop_id in canonical_ids]
    
    source_list = list(source_crops)
    source_embeddings = model.encode(source_list, show_progress_bar=True)
    canonical_embeddings = model.encode(canonical_names, show_progress_bar=True)
    
    similarities = cosine_similarity(source_embeddings, canonical_embeddings)
    
    source_map = {}
    new_entries = []
    
    for i, crop in enumerate(source_list):
        best_idx = similarities[i].argmax()
        best_score = similarities[i][best_idx]
        
        if best_score >= threshold:
            source_map[crop] = canonical_ids[best_idx]
        else:
            new_id = crop.lower().replace(" ", "-").replace("(", "").replace(")", "").replace(",", "")
            index[new_id] = {
                "id": new_id,
                "name": crop.title(),
                "commodityGroup": "Unknown",
                "sourceId": "new"
            }
            embeddings[new_id] = {
                "id": new_id,
                "embedding": source_embeddings[i].tolist(),
                "metadata": {
                    "canonical_name": crop.title(),
                    "commodity_group": "Unknown",
                    "source_id": "new"
                }
            }
            source_map[crop] = new_id
            new_entries.append(crop)
    
    return source_map, new_entries


def main():
    parser = argparse.ArgumentParser(description="Create crop map for a data source")
    parser.add_argument("source", nargs="?", help="Source name (e.g., msamb, agmarknet, krishimaratavahini)")
    parser.add_argument("--threshold", type=float, default=0.5, help="Similarity threshold (default: 0.5)")
    args = parser.parse_args()
    
    if not args.source:
        available_sources = []
        if PARSER_DIR.exists():
            for d in PARSER_DIR.iterdir():
                if d.is_dir():
                    available_sources.append(d.name)
        print(f"Usage: python embed_crops.py <source>")
        print(f"Available sources: {', '.join(available_sources)}")
        print(f"Or run without arguments to generate embeddings only.")
        return
    
    source = args.source
    source_dir = PARSER_DIR / source
    if not source_dir.exists():
        print(f"Error: Source '{source}' not found in {PARSER_DIR}")
        return
    
    print(f"Loading crop index and embeddings...")
    index = load_index()
    embeddings = load_embeddings()
    print(f"Loaded {len(index)} canonical crops")
    
    print(f"Collecting crops from source: {source}...")
    source_crops = get_source_crops(source)
    print(f"Found {len(source_crops)} unique crop names")
    
    print(f"Loading model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    print(f"Performing fuzzy matching...")
    source_map, new_entries = batch_fuzzy_match(source_crops, index, embeddings, model, threshold=args.threshold)
    
    if new_entries:
        print(f"Adding {len(new_entries)} new entries to index...")
        save_index(index)
        save_embeddings(embeddings)
        print(f"Updated index and embeddings files")
    
    matched = len(source_map) - len(new_entries)
    
    output_file = MAPPER_DIR / "crop-map" / f"{source}.json"
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w") as f:
        json.dump(source_map, f, indent=2)
    
    print(f"\nDone! Created {output_file}")
    print(f"  Total mappings: {len(source_map)}")
    print(f"  Matched: {matched}")
    print(f"  New entries added: {len(new_entries)}")


if __name__ == "__main__":
    main()
