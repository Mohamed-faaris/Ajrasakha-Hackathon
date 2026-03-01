import json
import os
from pathlib import Path

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("sentence-transformers not installed. Installing...")
    os.system("pip install sentence-transformers scikit-learn")
    from sentence_transformers import SentenceTransformer

MAPPER_DIR = Path("/workspaces/Ajrasakha-Hackathon/scraper-engine/mapper-apmc")
INDEX_FILE = MAPPER_DIR / "apmc-map" / "index.json"
EMBEDDINGS_FILE = MAPPER_DIR / "apmc-map" / "embeddings.json"


def load_index():
    with open(INDEX_FILE, "r") as f:
        return json.load(f)


def generate_embeddings(mandis, model_name="all-MiniLM-L6-v2"):
    print(f"Loading model: {model_name}")
    model = SentenceTransformer(model_name)
    
    names = list(mandis.keys())
    texts = [f"{name} mandi" for name in names]
    
    print(f"Generating embeddings for {len(texts)} mandis...")
    embeddings = model.encode(texts, show_progress_bar=True)
    
    result = {}
    for i, mandi_name in enumerate(names):
        mandi_data = mandis[mandi_name]
        result[mandi_name] = {
            "mandiId": mandi_data["mandiId"],
            "stateId": mandi_data["stateId"],
            "embedding": embeddings[i].tolist()
        }
    
    return result


def main():
    print("Loading mandi index...")
    mandis = load_index()
    print(f"Loaded {len(mandis)} mandis")
    
    print("Generating embeddings...")
    embeddings = generate_embeddings(mandis)
    
    EMBEDDINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(EMBEDDINGS_FILE, "w") as f:
        json.dump(embeddings, f, indent=2)
    print(f"Embeddings saved to {EMBEDDINGS_FILE}")
    
    print(f"\nDone! Generated embeddings for {len(embeddings)} mandis")


if __name__ == "__main__":
    main()
