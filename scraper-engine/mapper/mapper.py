"""Main mapper module - CLI and orchestration."""

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

from .models import CanonicalCrop
from .normalizer import CropNormalizer


DEFAULT_CROPS = [
    # Cereals
    ("wheat", ["Wheat", "Gehun", "Triticum"]),
    ("rice", ["Rice", "Dhan", "Paddy", "Oryza"]),
    ("corn", ["Corn", "Maize", "Makai", "Zea mays"]),
    ("barley", ["Barley", "Jau"]),
    ("sorghum", ["Sorghum", "Jowar", "Great millet"]),
    ("pearl_millet", ["Pearl millet", "Bajra", "Bajri"]),
    # Cash crops
    ("cotton", ["Cotton", "Kapas"]),
    ("sugarcane", ["Sugarcane", "Ganna"]),
    ("soybean", ["Soybean", "Soya"]),
    ("groundnut", ["Groundnut", "Peanut", "Moongfali"]),
    ("mustard", ["Mustard", "Sarson", "Rapeseed"]),
    ("sesame", ["Sesame", "Til"]),
    # Vegetables
    ("potato", ["Potato", "Aloo"]),
    ("onion", ["Onion", "Pyaj"]),
    ("tomato", ["Tomato", "Tamatar"]),
    ("brinjal", ["Brinjal", "Eggplant", "Baingan"]),
    ("okra", ["Okra", "Lady finger", "Bhindi"]),
    ("chili", ["Chili", "Chilli", "Mirch"]),
    # Fruits
    ("banana", ["Banana", "Kela"]),
    ("mango", ["Mango", "Aam"]),
    ("apple", ["Apple", "Seb"]),
    ("orange", ["Orange", "Narangi", "Santra"]),
    ("grape", ["Grape", "Angoor"]),
]


def initialize_defaults(data_dir: Optional[Path] = None) -> None:
    """Initialize default crops in the mapper."""
    normalizer = CropNormalizer(data_dir)
    
    print("Initializing default crops...")
    for canonical_id, aliases in DEFAULT_CROPS:
        crop = normalizer.add_crop(aliases[0], aliases)
        print(f"  ✓ {crop.name} (id: {crop.id})")
    
    stats = normalizer.embeddings.get_embedding_stats()
    print(f"\nInitialized {stats['total_embeddings']} crops")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Semantic Crop Normalization Mapper",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python -m mapper --init                    # Initialize with default crops
  python -m mapper --add-crop "Wheat"        # Add a new crop
  python -m mapper --normalize agmarknet "WHEAT"  # Normalize from source
  python -m mapper --search "wheet"          # Search similar crops
  python -m mapper --list                    # List all crops
        """
    )
    
    parser.add_argument("--data-dir", type=Path, help="Data directory path")
    parser.add_argument("--init", action="store_true", help="Initialize with default crops")
    parser.add_argument("--add-crop", metavar="NAME", help="Add a new canonical crop")
    parser.add_argument("--add-alias", metavar="ALIAS", help="Add alias (use with --source and --canonical-id)")
    parser.add_argument("--source", help="Source name")
    parser.add_argument("--canonical-id", help="Canonical crop ID")
    parser.add_argument("--normalize", nargs=2, metavar=("SOURCE", "NAME"), help="Normalize crop name from source")
    parser.add_argument("--search", metavar="QUERY", help="Search for crops")
    parser.add_argument("--list", action="store_true", help="List all canonical crops")
    parser.add_argument("--stats", action="store_true", help="Show mapper statistics")
    parser.add_argument("--top-k", type=int, default=5, help="Number of search results (default: 5)")
    
    args = parser.parse_args()
    
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(0)
    
    if args.init:
        initialize_defaults(args.data_dir)
        return
    
    normalizer = CropNormalizer(args.data_dir)
    
    if args.add_crop:
        crop = normalizer.add_crop(args.add_crop)
        print(f"Added crop: {crop.name} (id: {crop.id})")
        return
    
    if args.add_alias and args.source and args.canonical_id:
        normalizer.registry.add_alias(args.source, args.add_alias, args.canonical_id)
        print(f"Added alias '{args.add_alias}' -> '{args.canonical_id}' for source '{args.source}'")
        return
    
    if args.normalize:
        source, name = args.normalize
        result = normalizer.normalize(name, source)
        if result:
            crop = normalizer.get_crop(result)
            crop_name = crop.name if crop else result
            print(f"{name} ({source}) -> {result} ({crop_name})")
        else:
            # Try semantic search for suggestions
            suggestions = normalizer.search(name, top_k=3)
            print(f"No exact match for '{name}' from source '{source}'")
            if suggestions:
                print("Did you mean:")
                for s in suggestions:
                    print(f"  - {s.crop.name} (score: {s.score:.2f})")
        return
    
    if args.search:
        results = normalizer.search(args.search, top_k=args.top_k)
        if results:
            print(f"Search results for '{args.search}':")
            for r in results:
                match_type = "exact" if r.score == 1.0 else "similar"
                print(f"  - {r.crop.name} (id: {r.crop.id}, score: {r.score:.2f}, {match_type})")
        else:
            print(f"No matches found for '{args.search}'")
        return
    
    if args.list:
        crops = normalizer.list_all_crops()
        if crops:
            print(f"Canonical crops ({len(crops)} total):")
            for c in sorted(crops, key=lambda x: x.name):
                aliases = f", aliases: {', '.join(c.aliases)}" if c.aliases else ""
                print(f"  - {c.name} (id: {c.id}){aliases}")
        else:
            print("No crops in registry. Run with --init to add defaults.")
        return
    
    if args.stats:
        crops = normalizer.list_all_crops()
        sources = normalizer.registry.list_sources()
        emb_stats = normalizer.embeddings.get_embedding_stats()
        
        print("Mapper Statistics:")
        print(f"  Canonical crops: {len(crops)}")
        print(f"  Data sources: {len(sources)}")
        for src in sources:
            aliases = normalizer.registry.get_source_aliases(src)
            print(f"    - {src}: {len(aliases)} aliases")
        print(f"  Embeddings: {emb_stats['total_embeddings']}")
        print(f"  Embedding model: {'sentence-transformers' if emb_stats['using_transformer'] else 'fallback'}")
        return


if __name__ == "__main__":
    main()
