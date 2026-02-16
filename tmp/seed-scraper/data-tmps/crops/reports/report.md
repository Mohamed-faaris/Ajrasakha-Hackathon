# Data Structure & Model Comparison Report

This report outlines the structural differences between the raw seed data (`data.json`) and the implemented MongoDB models in the Express server.

## 1. Naming Conventions & Case

- **Seed Data (`data.json`)**: Uses **snake_case** (e.g., `cmdt_name`, `state_id`, `mkt_name`).
- **Models (`Mongoose`)**: Uses **camelCase** for properties (e.g., `commodityGroup`, `stateId`, `districtName`) and **lowercase slugs** for primary identifiers.

## 2. Identifier Strategy

| Entity    | `data.json` Primary ID            | MongoDB `_id` (Slug Strategy)                |
| :-------- | :-------------------------------- | :------------------------------------------- |
| **Crop**  | Numerical `cmdt_id` (e.g., `380`) | String Slug (e.g., `"absinthe"`)             |
| **State** | Numerical `state_id` (e.g., `2`)  | String Slug (e.g., `"andhra-pradesh"`)       |
| **Mandi** | Numerical `id` (e.g., `1235`)     | String Slug (e.g., `"a-lot-apmc-rajasthan"`) |

> **Note**: The numerical IDs from the seed data are mapped to `sourceMandiId` or used only during the ingestion phase, while the application uses human-readable slugs for SEO-friendly URLs.

## 3. Entity Mapping & Schema Differences

### Crops

- **Source**: `cmdt_data` is linked to `cmdt_group_data` via `cmdt_group_id`.
- **Model**: The `Crop` model simplifies this by storing the `commodityGroup` name directly as a string, avoiding additional joins.

### States & Districts

- **Source**: Flat lists linked by `state_id`.
- **Model**: The `State` model introduces a `code` field (e.g., "AP") not present in the seed.

### Mandis (Markets)

- **Source**: Contains only `id`, `mkt_name`, `state_id`, and `district_id`.
- **Model**: Highly enriched with:
  - **Geospatial**: `location` (GeoJSON Point) for mapping.
  - **Denormalization**: Stores `stateName` and `districtName` directly to optimize API performance.
  - **External Refs**: `apmcCode` and `sourceMandiId`.

## 4. Requirement Gaps for Ingestion

To successfully seed the database from `data.json`, the following must be handled by the ingestion script:

1.  **Slugification**: Logic to convert names (e.g., "Andhra Pradesh") into valid URL slugs (`"andhra-pradesh"`).
2.  **Geocoding**: The coordinates `[lng, lat]` for `location` are missing from the seed and must be sourced externally.
3.  **Data Cleaning**: Names in the seed are often mixed-case; the model enforces `uppercase` for display names and `lowercase` for `_id`.
4.  **Relationship Resolution**: Mapping the numerical `state_id` from a market entry to the corresponding slug in the `states` collection.

---

**Report Timestamp**: 2026-02-17
**Status**: Analysis Complete
