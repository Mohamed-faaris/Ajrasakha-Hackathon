Semantic Crop Normalization & Search System
Overview

This project implements a canonical identity system for agricultural crop data combined with embeddings + vector database for semantic search.

Different data sources may use different crop names.
This system ensures:

All equivalent crop names map to a single canonical ID.

New sources can be integrated without breaking identity consistency.

Semantic search resolves user queries to canonical crop identities.

The system separates:

Canonical Identity Layer

Source Alias Layer

Embedding & Vector Search Layer

Architecture
1. Canonical Registry (index.json)

Single source of truth for crop identity.

{
  "wheat": {
    "id": "wheat",
    "name": "Wheat"
  },
  "corn": {
    "id": "corn",
    "name": "Corn"
  }
}

Responsibilities:

Defines unique crop IDs.

Prevents duplication.

Ensures consistent identity across all sources.

Stores canonical display name.

Invariant:

Each crop ID is globally unique.
2. Source Alias Maps ([source-name].json)

Each data source has its own alias mapping file.

Example: source1.json

{
  "WHEAT": "wheat",
  "CORN": "corn"
}

Responsibilities:

Maps source-specific names → canonical crop IDs.

Allows different naming conventions per source.

Keeps source logic isolated.

Important:

Source files never define identity.

They only reference canonical IDs.

3. Embeddings + Vector Database

Embeddings are generated only for canonical crops.

Example stored in vector DB:

id: wheat
embedding: [0.0123, 0.9912, ...]
metadata:
  canonical_name: Wheat
  aliases: [WHEAT, Wheart, Triticum]

Semantic search flow:

User Input
   ↓
Generate embedding
   ↓
Vector similarity search
   ↓
Retrieve canonical ID
   ↓
Resolve via index.json

This ensures:

Synonyms and typos resolve correctly.

Cross-source identity remains consistent.

New aliases don’t require re-indexing the entire database.

Workflow
A. Adding a New Source

Create [source-name].json.

For each crop in source:

Normalize name.

Check if canonical ID exists in index.json.

If ID exists:

Map alias → existing ID.

If ID does not exist:

Add new entry to index.json.

Generate embedding.

Insert into vector database.

Map alias → new ID.

B. Adding a New Crop from a Source

Example:
Source2 contains BARLEY.

Step 1: Check canonical registry.

If barley not present → add to index.json.

"barley": {
  "id": "barley",
  "name": "Barley"
}

Step 2:

Generate embedding.

Store in vector database.

Step 3:

Update source2.json:

{
  "BARLEY": "barley"
}
C. Handling Duplicate Names Across Sources

If two sources use different names for the same crop:

Source1: WHEAT
Source2: Wheart

Both map to:

"wheat"

Canonical ID ensures identity consistency.

D. Preventing Identity Collisions

Before merging crops:

Perform semantic similarity check.

Validate manually if similarity is high but not exact.

Avoid automatic merging without validation.

Optional enhancement:

Maintain hierarchy (e.g., wheat_durum, wheat_soft).

Data Integrity Rules

IDs are lowercase and unique.

IDs never change once created.

Source files cannot create identity — only reference it.

Embeddings are stored at canonical level only.

Canonical registry must be updated before vector database insertion.