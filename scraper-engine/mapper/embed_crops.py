import json
import os
from pathlib import Path

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("sentence-transformers not installed. Installing...")
    os.system("pip install sentence-transformers")
    from sentence_transformers import SentenceTransformer

CROPS_FILE = "/workspaces/Ajrasakha-Hackathon/seeder/data/crops.converted.json"
MAPPER_DIR = Path("/workspaces/Ajrasakha-Hackathon/scraper-engine/mapper")
INDEX_FILE = MAPPER_DIR / "crop-map" / "index.json"
EMBEDDINGS_FILE = MAPPER_DIR / "crop-map" / "embeddings.json"
SOURCE_ALIAS_FILE = MAPPER_DIR / "crop-map" / "agmarknet.json"

def load_crops():
    with open(CROPS_FILE, "r") as f:
        return json.load(f)

def create_canonical_registry(crops):
    registry = {}
    for crop in crops:
        crop_id = crop["_id"]
        registry[crop_id] = {
            "id": crop_id,
            "name": crop["name"].title(),
            "commodityGroup": crop["commodityGroup"],
            "sourceId": crop["sourceId"]
        }
    return registry

def create_source_aliases(crops):
    aliases = {}
    for crop in crops:
        aliases[crop["name"]] = crop["_id"]
    return aliases

def generate_embeddings(crops, model_name="all-MiniLM-L6-v2"):
    print(f"Loading model: {model_name}")
    model = SentenceTransformer(model_name)
    
    texts = []
    for crop in crops:
        text = f"{crop['name']} - {crop['commodityGroup']}"
        texts.append(text)
    
    print(f"Generating embeddings for {len(texts)} crops...")
    embeddings = model.encode(texts, show_progress_bar=True)
    
    result = {}
    for i, crop in enumerate(crops):
        result[crop["_id"]] = {
            "id": crop["_id"],
            "embedding": embeddings[i].tolist(),
            "metadata": {
                "canonical_name": crop["name"].title(),
                "commodity_group": crop["commodityGroup"],
                "source_id": crop["sourceId"]
            }
        }
    
    return result

def main():
    print("Loading crops data...")
    crops = load_crops()
    print(f"Loaded {len(crops)} crops")
    
    print("Creating canonical registry...")
    registry = create_canonical_registry(crops)
    
    INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(INDEX_FILE, "w") as f:
        json.dump(registry, f, indent=2)
    print(f"Canonical registry saved to {INDEX_FILE}")
    
    print("Creating source aliases...")
    aliases = create_source_aliases(crops)
    with open(SOURCE_ALIAS_FILE, "w") as f:
        json.dump(aliases, f, indent=2)
    print(f"Source aliases saved to {SOURCE_ALIAS_FILE}")
    
    print("Generating embeddings...")
    embeddings = generate_embeddings(crops)
    
    with open(EMBEDDINGS_FILE, "w") as f:
        json.dump(embeddings, f, indent=2)
    print(f"Embeddings saved to {EMBEDDINGS_FILE}")
    
    print(f"\nDone! Processed {len(crops)} crops")
    print(f"  - Canonical registry: {INDEX_FILE}")
    print(f"  - Source aliases: {SOURCE_ALIAS_FILE}")
    print(f"  - Embeddings: {EMBEDDINGS_FILE}")

if __name__ == "__main__":
    main()
