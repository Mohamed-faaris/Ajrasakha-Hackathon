# Database Models & Architecture

## Overview

This document outlines the MongoDB models, cache strategy, and data flow for the Ajrasakha agricultural price intelligence system as served by the Express API and React client.

---

## Database Connection

Configure the MongoDB connection in `.env`:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/?appName=<app>
```

Standardize on plural, lowercase collection names (`crops`, `states`, `mandis`, `prices`, etc.) to keep queries predictable.

---

## Model Architecture

### Core Entities (Persisted)

| Model     | Purpose                                     | Collection |
| --------- | ------------------------------------------- | ---------- |
| **Crop**  | Agricultural commodity metadata             | `crops`    |
| **State** | Indian states                               | `states`   |
| **Mandi** | Markets/APMCs with district and geo context | `mandis`   |
| **Price** | Daily pricing observations                  | `prices`   |
| **Alert** | User-driven price alerts                    | `alerts`   |

### Auth Entities (Better Auth Managed)

| Collection     | Purpose                   |
| -------------- | ------------------------- |
| `user`         | User accounts             |
| `session`      | Active sessions           |
| `account`      | OAuth accounts            |
| `verification` | Email verification tokens |

### Computed/Cache Entities

| Model          | Purpose                                | Strategy                  |
| -------------- | -------------------------------------- | ------------------------- |
| **TopMover**   | Price gainers and losers               | Cached daily, TTL 24h     |
| **Coverage**   | System coverage stats singleton        | Hourly overwrite (no TTL) |
| **PriceTrend** | Historical trends per crop/mandi/state | Cache-aside, TTL 15m      |
| **MandiPrice** | Map-ready mandi price per crop         | Cached daily, TTL 24h     |

---

## Model Schemas

### 1. Crop

```typescript
// server/src/models/crop.model.ts
import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // e.g., "wheat", "paddy", "onion"
    },
    name: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    commodityGroup: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "crops",
  },
);

cropSchema.index({ name: 1 });
cropSchema.index({ commodityGroup: 1 });

export const Crop = mongoose.model("Crop", cropSchema);
```

### 2. State

```typescript
// server/src/models/state.model.ts
import mongoose from "mongoose";

const stateSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // e.g., "tamil-nadu", "rajasthan"
    },
    name: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    code: {
      type: String,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "states",
  },
);

stateSchema.index({ name: 1 });
stateSchema.index({ code: 1 });

export const State = mongoose.model("State", stateSchema);
```

### 3. Mandi

```typescript
// server/src/models/mandi.model.ts
import mongoose from "mongoose";

const mandiSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    stateId: {
      type: String,
      required: true,
      ref: "State",
    },
    stateName: {
      type: String,
      required: true,
      uppercase: true,
    },
    districtId: {
      type: String,
      trim: true,
      lowercase: true,
    },
    districtName: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    apmcCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    sourceMandiId: {
      type: String,
      trim: true,
      lowercase: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        // Order: [longitude, latitude]
      },
    },
  },
  {
    timestamps: true,
    collection: "mandis",
  },
);

mandiSchema.index({ stateId: 1 });
mandiSchema.index({ districtId: 1 });
mandiSchema.index({ name: 1 });
mandiSchema.index({ location: "2dsphere" });
mandiSchema.index({ sourceMandiId: 1 });

export const Mandi = mongoose.model("Mandi", mandiSchema);
```

### 4. Price (Core Entity)

```typescript
// server/src/models/price.model.ts
import mongoose from "mongoose";

const priceSchema = new mongoose.Schema(
  {
    cropId: {
      type: String,
      required: true,
      ref: "Crop",
    },
    cropName: {
      type: String,
      required: true,
      uppercase: true,
    },
    mandiId: {
      type: String,
      required: true,
      ref: "Mandi",
    },
    mandiName: {
      type: String,
      required: true,
      uppercase: true,
    },
    stateId: {
      type: String,
      required: true,
      ref: "State",
    },
    stateName: {
      type: String,
      required: true,
      uppercase: true,
    },
    districtId: {
      type: String,
      trim: true,
      lowercase: true,
    },
    districtName: {
      type: String,
      required: true,
      uppercase: true,
    },
    date: {
      type: Date,
      required: true,
    },
    minPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    maxPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    modalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: "Qui",
    },
    arrival: {
      type: Number,
      min: 0,
    },
    source: {
      type: String,
      enum: ["agmarknet", "enam", "apmc", "other"],
      default: "other",
    },
    sourceId: {
      type: String,
      trim: true,
    },
    apmcCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "prices",
  },
);

priceSchema.index({ date: -1 });
priceSchema.index({ mandiId: 1, date: -1 });
priceSchema.index({ cropId: 1, date: -1 });
priceSchema.index({ stateId: 1, cropId: 1, date: -1 });
priceSchema.index({ mandiId: 1, cropId: 1, date: -1 });
priceSchema.index({ mandiId: 1, cropId: 1, districtId: 1, date: -1 });
priceSchema.index({ source: 1, date: -1 });
priceSchema.index({ mandiId: 1, modalPrice: -1 });
priceSchema.index({ mandiId: 1, stateName: 1, districtName: 1 });
priceSchema.index(
  { source: 1, date: 1, cropId: 1, mandiId: 1 },
  { unique: true },
);

export const Price = mongoose.model("Price", priceSchema);
```

### 5. UserProfile

```typescript
// server/src/models/userProfile.model.ts
import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "user",
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Invalid Indian phone number"],
    },
    state: {
      type: String,
      trim: true,
      uppercase: true,
    },
    district: {
      type: String,
      trim: true,
      uppercase: true,
    },
    preferredCrops: [
      {
        type: String,
      },
    ],
    preferredMandis: [
      {
        type: String,
      },
    ],
    notificationSettings: {
      email: {
        enabled: { type: Boolean, default: true },
        priceAlerts: { type: Boolean, default: true },
        dailyDigest: { type: Boolean, default: false },
        weeklyReport: { type: Boolean, default: true },
      },
      sms: {
        enabled: { type: Boolean, default: false },
        priceAlerts: { type: Boolean, default: false },
      },
      push: {
        enabled: { type: Boolean, default: true },
        priceAlerts: { type: Boolean, default: true },
      },
    },
    language: {
      type: String,
      default: "en",
      enum: ["en", "hi", "mr", "te", "ta", "kn", "gu", "pa"],
    },
    avatar: {
      type: String,
    },
    farmerDetails: {
      isFarmer: { type: Boolean, default: false },
      farmSize: { type: Number },
      farmLocation: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
        },
      },
      primaryCrops: [
        {
          type: String,
        },
      ],
    },
    traderDetails: {
      isTrader: { type: Boolean, default: false },
      companyName: { type: String, trim: true },
      gstNumber: { type: String, trim: true },
      tradingStates: [
        {
          type: String,
        },
      ],
    },
  },
  {
    timestamps: true,
    collection: "userprofiles",
  },
);

userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ state: 1 });
userProfileSchema.index({ "farmerDetails.farmLocation": "2dsphere" });

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);
```

### 6. Alert

```typescript
// server/src/models/alert.model.ts
import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    cropId: {
      type: String,
      required: true,
      ref: "Crop",
    },
    cropName: {
      type: String,
      required: true,
      uppercase: true,
    },
    mandiId: {
      type: String,
      ref: "Mandi",
    },
    mandiName: {
      type: String,
      uppercase: true,
    },
    thresholdPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    direction: {
      type: String,
      required: true,
      enum: ["above", "below"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    triggeredAt: {
      type: Date,
    },
    message: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "alerts",
  },
);

alertSchema.index({ userId: 1, isActive: 1 });
alertSchema.index({ cropId: 1, isActive: 1 });
alertSchema.index({ mandiId: 1, isActive: 1 });

export const Alert = mongoose.model("Alert", alertSchema);
```

### 7. TopMover (Cached)

```typescript
// server/src/models/topMover.model.ts
import mongoose from "mongoose";

const topMoverSchema = new mongoose.Schema(
  {
    cropId: {
      type: String,
      required: true,
      ref: "Crop",
    },
    cropName: {
      type: String,
      required: true,
      uppercase: true,
    },
    latestPrice: {
      type: Number,
      required: true,
    },
    previousPrice: {
      type: Number,
      required: true,
    },
    changePct: {
      type: Number,
      required: true,
    },
    direction: {
      type: String,
      required: true,
      enum: ["up", "down"],
    },
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "topmovers",
  },
);

topMoverSchema.index({ computedAt: 1 }, { expireAfterSeconds: 86400 });
topMoverSchema.index({ direction: 1, changePct: -1 });

export const TopMover = mongoose.model("TopMover", topMoverSchema);
```

### 8. Coverage (Cached Singleton)

```typescript
// server/src/models/coverage.model.ts
import mongoose from "mongoose";

const coverageSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: "current",
    },
    totalApmcs: {
      type: Number,
      default: 0,
    },
    coveredApmcs: {
      type: Number,
      default: 0,
    },
    coveragePercent: {
      type: Number,
      default: 0,
    },
    statesCovered: {
      type: Number,
      default: 0,
    },
    totalPrices: {
      type: Number,
      default: 0,
    },
    latestDate: {
      type: Date,
    },
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "coverage",
  },
);

export const Coverage = mongoose.model("Coverage", coverageSchema);
```

### 9. PriceTrend (Cached)

```typescript
// server/src/models/priceTrend.model.ts
import mongoose from "mongoose";

const priceTrendSchema = new mongoose.Schema(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
      // Format: `${cropId}:${mandiId}:${stateId ?? 'all'}:${days}`
    },
    cropId: { type: String, required: true },
    mandiId: { type: String, required: true },
    stateId: { type: String },
    data: [
      {
        date: { type: Date, required: true },
        modalPrice: { type: Number, required: true },
      },
    ],
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "pricetrends",
  },
);

priceTrendSchema.index({ cropId: 1, mandiId: 1, stateId: 1 });
priceTrendSchema.index({ computedAt: 1 }, { expireAfterSeconds: 900 });

export const PriceTrend = mongoose.model("PriceTrend", priceTrendSchema);
```

### 10. MandiPrice (Cached for Map)

```typescript
// server/src/models/mandiPrice.model.ts
import mongoose from "mongoose";

const mandiPriceSchema = new mongoose.Schema(
  {
    mandiId: {
      type: String,
      required: true,
      ref: "Mandi",
    },
    mandiName: {
      type: String,
      required: true,
      uppercase: true,
    },
    cropId: {
      type: String,
      required: true,
      ref: "Crop",
    },
    cropName: {
      type: String,
      uppercase: true,
    },
    stateName: {
      type: String,
      required: true,
      uppercase: true,
    },
    districtName: {
      type: String,
      uppercase: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    modalPrice: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "mandiprices",
  },
);

mandiPriceSchema.index({ location: "2dsphere" });
mandiPriceSchema.index({ stateName: 1 });
mandiPriceSchema.index({ mandiId: 1, cropId: 1, date: -1 });
mandiPriceSchema.index({ computedAt: 1 }, { expireAfterSeconds: 86400 });

export const MandiPrice = mongoose.model("MandiPrice", mandiPriceSchema);
```

---

## Cache Strategy

### TTL-Based Expiration

| Collection    | TTL | Refresh Mechanism                                                             |
| ------------- | --- | ----------------------------------------------------------------------------- |
| `topmovers`   | 24h | Daily cron job rewrites cache documents while TTL index removes stale entries |
| `coverage`    | n/a | Singleton `_id = 'current'` overwritten hourly; manual refresh                |
| `pricetrends` | 15m | Cache-aside recompute when missing; TTL index cleans up stale keys            |
| `mandiprices` | 24h | Daily cron repopulates entries per mandi/crop; TTL index enforces expiry      |

### Cache Invalidation

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE INVALIDATION                        │
├─────────────────────────────────────────────────────────────┤
│  New Price Data Ingress                                      │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────────┐    │
│  │ Price   │───▶│ Invalidate   │───▶│ Recompute       │    │
│  │ Insert  │    │ Related Cache│    │ On Next Request │    │
│  └─────────┘    └──────────────┘    └─────────────────┘    │
│                                                              │
│  TTL handles automatic expiration for topmovers, pricetrends,│
│  and mandiprices.                                            │
│  Manual invalidation for:                                    │
│    - Coverage: overwrite the singleton document hourly        │
│    - TopMovers: rerun aggregation when price backfill arrives │
│    - MandiPrice: refresh per mandi/crop combination           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Cache-Aside Pattern

```typescript
async function getPriceTrends(
  cropId: string,
  mandiId: string,
  stateId: string | null,
  days: number,
) {
  const cacheKey = `${cropId}:${mandiId}:${stateId ?? "all"}:${days}`;
  const cached = await PriceTrend.findOne({ cacheKey });
  if (cached) return cached.data;

  const data = await computeTrends(cropId, mandiId, stateId, days);
  await PriceTrend.create({ cacheKey, cropId, mandiId, stateId, data });
  return data;
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐      ┌──────────┐      ┌───────────┐              │
│  │ Scraper  │─────▶│ Price    │─────▶│ MongoDB   │              │
│  │ (Python) │      │ Records  │      │ (Core)    │              │
│  └──────────┘      └──────────┘      └───────────┘              │
│                           │                                      │
│                           ▼                                      │
│                    ┌──────────────┐                              │
│                    │ Aggregation  │                              │
│                    │ Jobs (Cron)  │                              │
│                    └──────────────┘                              │
│                           │                                      │
│              ┌────────────┼────────────┐                         │
│              ▼            ▼            ▼                         │
│       ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│       │TopMovers │ │Coverage  │ │MandiPrice│                    │
│       │ (24h TTL)│ │ (Singleton) ││ (24h TTL)│                    │
│       └──────────┘ └──────────┘ └──────────┘                    │
│              │            │            │                         │
│              └────────────┴────────────┘                         │
│                           │                                      │
│                           ▼                                      │
│                    ┌──────────────┐                              │
│                    │    API       │                              │
│                    │  (Express)   │                              │
│                    └──────────────┘                              │
│                           │                                      │
│                           ▼                                      │
│                    ┌──────────────┐                              │
│                    │   Client     │                              │
│                    │   (React)    │                              │
│                    └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Query Patterns

### Most Common Queries

| Query                        | Index Used                            | Notes                         |
| ---------------------------- | ------------------------------------- | ----------------------------- |
| Latest prices by crop/mandi  | `{ mandiId: 1, cropId: 1, date: -1 }` | Paginated per mandi/crop pair |
| Prices by mandi + date range | `{ mandiId: 1, date: -1 }`            | Filter by date                |
| Prices by state + crop       | `{ stateId: 1, cropId: 1, date: -1 }` | Dashboard views               |
| Map mandis in bounds         | `{ location: '2dsphere' }`            | Geo queries for mandis        |
| Top movers (up/down)         | `{ direction: 1, changePct: -1 }`     | Sorted top gainers/losers     |
| User alerts                  | `{ userId: 1, isActive: 1 }`          | Alert management              |

### Example Queries

```typescript
// Latest prices for a crop per mandi
Price.find({ cropId: "wheat" }).sort({ date: -1 }).limit(20);

// Prices in date range for mandi
Price.find({
  mandiId: "kota-rajasthan",
  date: { $gte: startDate, $lte: endDate },
}).sort({ date: -1 });

// Mandis within map bounds
Mandi.find({
  location: {
    $geoWithin: {
      $box: [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
    },
  },
});

// Top gainers
TopMover.find({ direction: "up" }).sort({ changePct: -1 }).limit(10);
```

---

## File Structure

```
server/src/models/
├── index.ts             # Export all models
├── crop.model.ts        # Crop schema
├── state.model.ts       # State schema
├── mandi.model.ts       # Mandi schema
├── price.model.ts       # Price schema (core)
├── userProfile.model.ts # Extended user profiles
├── alert.model.ts       # User alerts
├── topMover.model.ts    # Cached top movers
├── coverage.model.ts    # Cached coverage stats
├── priceTrend.model.ts  # Cached trends
└── mandiPrice.model.ts  # Cached map data
```

---

## Migration Notes

1. **Existing Data**: Ensure `_id` values for `Crop`, `State`, and `Mandi` follow the slug strategy (e.g., "kota-rajasthan", "wheat").
2. **Indexes**: Run `ensureIndexes()` on first server start to register TTL indexes.
3. **Better Auth**: Collections `user`, `session`, `account`, and `verification` remain managed by BetterAuth/NextAuth.
4. **Geo Indexes**: Geolocation fields must be GeoJSON points with `[lng, lat]` ordering.# Database Models & Architecture

## Overview

This document outlines the MongoDB models, cache strategy, and data flow for the Ajrasakha agricultural price intelligence system as served by the Express API and React client.

---

## Database Connection

Configure the MongoDB connection in `.env`:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/?appName=<app>
```

Standardize on plural, lowercase collection names (`crops`, `states`, `mandis`, `prices`, etc.) to keep queries predictable.

---

## Model Architecture

### Core Entities (Persisted)

| Model     | Purpose                             | Collection |
| --------- | ----------------------------------- | ---------- |
| **Crop**  | Agricultural commodity metadata     | `crops`    |
| **State** | Indian states                       | `states`   |
| **Mandi** | Markets/APMCs with district context | `mandis`   |
| **Price** | Daily pricing observations          | `prices`   |
| **Alert** | User-driven price alerts            | `alerts`   |

### Auth Entities (Better Auth Managed)

| Collection     | Purpose                   |
| -------------- | ------------------------- |
| `user`         | User accounts             |
| `session`      | Active sessions           |
| `account`      | OAuth accounts            |
| `verification` | Email verification tokens |

### Computed/Cache Entities

| Model          | Purpose                                | Strategy                            |
| -------------- | -------------------------------------- | ----------------------------------- |
| **TopMover**   | Price gainers/losers                   | Cached daily, TTL 24h               |
| **Coverage**   | System coverage stats                  | Hourly overwrite with singleton doc |
| **PriceTrend** | Historical trends per crop/mandi/state | Cache-aside, TTL 15m                |
| **MandiPrice** | Map-ready mandi price per crop         | Cached daily, TTL 24h               |

---

## Model Schemas

### 1. Crop

```typescript
// server/src/models/crop.model.ts
import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // e.g., "wheat", "paddy", "onion"
    },
    name: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      // e.g., "WHEAT", "PADDY", "ONION"
    },
    commodityGroup: {
      type: String,
      trim: true,
      // e.g., "Cereals", "Vegetables", "Pulses"
    },
  },
  {
    timestamps: true,
    collection: "crops",
  },
);

cropSchema.index({ name: 1 });
cropSchema.index({ commodityGroup: 1 });

export const Crop = mongoose.model("Crop", cropSchema);
```

### 2. State

```typescript
// server/src/models/state.model.ts
import mongoose from "mongoose";

const stateSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // e.g., "tamil-nadu", "rajasthan"
    },
    name: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      // e.g., "TAMIL NADU", "RAJASTHAN"
    },
    code: {
      type: String,
      uppercase: true,
      trim: true,
      // e.g., "TN", "RJ"
    },
  },
  {
    timestamps: true,
    collection: "states",
  },
);

stateSchema.index({ name: 1 });
stateSchema.index({ code: 1 });

export const State = mongoose.model("State", stateSchema);
```

### 3. Mandi

```typescript
// server/src/models/mandi.model.ts
import mongoose from "mongoose";

const mandiSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      // e.g., "kota-rajasthan", "guntur-andhra-pradesh"
    },
    name: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      // e.g., "KOTA", "GUNTUR"
    },
    stateId: {
      type: String,
      required: true,
      ref: "State",
      // References states._id
    },
    stateName: {
      type: String,
      required: true,
      uppercase: true,
    },
    districtId: {
      type: String,
      trim: true,
      lowercase: true,
    },
    districtName: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    apmcCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
    sourceMandiId: {
      type: String,
      trim: true,
      lowercase: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        // Order: [longitude, latitude]
      },
    },
  },
  {
    timestamps: true,
    collection: "mandis",
  },
);

mandiSchema.index({ stateId: 1 });
mandiSchema.index({ districtId: 1 });
mandiSchema.index({ name: 1 });
mandiSchema.index({ location: "2dsphere" });
mandiSchema.index({ sourceMandiId: 1 });

export const Mandi = mongoose.model("Mandi", mandiSchema);
```

### 4. Price (Core Entity)

```typescript
// server/src/models/price.model.ts
import mongoose from "mongoose";

const priceSchema = new mongoose.Schema(
  {
    cropId: {
      type: String,
      required: true,
      ref: "Crop",
    },
    cropName: {
      type: String,
      required: true,
      uppercase: true,
    },
    mandiId: {
      type: String,
      required: true,
      ref: "Mandi",
    },
    mandiName: {
      type: String,
      required: true,
      uppercase: true,
    },
    stateId: {
      type: String,
      required: true,
      ref: "State",
    },
    stateName: {
      type: String,
      required: true,
      uppercase: true,
    },
    districtId: {
      type: String,
      trim: true,
      lowercase: true,
    },
    districtName: {
      type: String,
      required: true,
      uppercase: true,
    },
    date: {
      type: Date,
      required: true,
    },
    minPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    maxPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    modalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: "Qui",
    },
    arrival: {
      type: Number,
      min: 0,
    },
    source: {
      type: String,
      enum: ["agmarknet", "enam", "apmc", "other"],
      default: "other",
    },
    sourceId: {
      type: String,
      trim: true,
    },
    apmcCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "prices",
  },
);

priceSchema.index({ date: -1 });
priceSchema.index({ mandiId: 1, date: -1 });
priceSchema.index({ cropId: 1, date: -1 });
priceSchema.index({ stateId: 1, cropId: 1, date: -1 });
priceSchema.index({ mandiId: 1, cropId: 1, date: -1 });
priceSchema.index({ mandiId: 1, cropId: 1, districtId: 1, date: -1 });
priceSchema.index({ source: 1, date: -1 });
priceSchema.index({ mandiId: 1, modalPrice: -1 });
priceSchema.index({ mandiId: 1, stateName: 1, districtName: 1 });
priceSchema.index(
  { source: 1, date: 1, cropId: 1, mandiId: 1 },
  { unique: true },
);

export const Price = mongoose.model("Price", priceSchema);
```

### 5. UserProfile

```typescript
// server/src/models/userProfile.model.ts
import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "user",
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\\d{9}$/, "Invalid Indian phone number"],
    },
    state: {
      type: String,
      trim: true,
      uppercase: true,
    },
    district: {
      type: String,
      trim: true,
      uppercase: true,
    },
    preferredCrops: [
      {
        type: String,
      },
    ],
    preferredMandis: [
      {
        type: String,
      },
    ],
    notificationSettings: {
      email: {
        enabled: { type: Boolean, default: true },
        priceAlerts: { type: Boolean, default: true },
        dailyDigest: { type: Boolean, default: false },
        weeklyReport: { type: Boolean, default: true },
      },
      sms: {
        enabled: { type: Boolean, default: false },
        priceAlerts: { type: Boolean, default: false },
      },
      push: {
        enabled: { type: Boolean, default: true },
        priceAlerts: { type: Boolean, default: true },
      },
    },
    language: {
      type: String,
      default: "en",
      enum: ["en", "hi", "mr", "te", "ta", "kn", "gu", "pa"],
    },
    avatar: {
      type: String,
    },
    farmerDetails: {
      isFarmer: { type: Boolean, default: false },
      farmSize: { type: Number },
      farmLocation: {
        type: {
          type: String,
          enum: ["Point"],
        },
        coordinates: {
          type: [Number],
        },
      },
      primaryCrops: [
        {
          type: String,
        },
      ],
    },
    traderDetails: {
      isTrader: { type: Boolean, default: false },
      companyName: { type: String, trim: true },
      gstNumber: { type: String, trim: true },
      tradingStates: [
        {
          type: String,
        },
      ],
    },
  },
  {
    timestamps: true,
    collection: "userprofiles",
  },
);

userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ state: 1 });
userProfileSchema.index({ "farmerDetails.farmLocation": "2dsphere" });

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);
```

### 6. Alert

```typescript
// server/src/models/alert.model.ts
import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    cropId: {
      type: String,
      required: true,
      ref: "Crop",
    },
    cropName: {
      type: String,
      required: true,
      uppercase: true,
    },
    mandiId: {
      type: String,
      ref: "Mandi",
    },
    mandiName: {
      type: String,
      uppercase: true,
    },
    thresholdPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    direction: {
      type: String,
      required: true,
      enum: ["above", "below"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    triggeredAt: {
      type: Date,
    },
    message: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "alerts",
  },
);

alertSchema.index({ userId: 1, isActive: 1 });
alertSchema.index({ cropId: 1, isActive: 1 });
alertSchema.index({ mandiId: 1, isActive: 1 });

export const Alert = mongoose.model("Alert", alertSchema);
```

### 7. TopMover (Cached)

```typescript
// server/src/models/topMover.model.ts
import mongoose from 'mongoose';

const topMoverSchema = new mongoose.Schema({
  cropId: {
    type: String,
    required: true,
    ref: 'Crop',
  },
  cropName: {
    type: String,
    required: true,
    uppercase: true,
  },
  latestPrice: {
    type: Number,
    required: true,
  },
  previousPrice: {
    type: Number,
    required: true,
  },
  changePct: {
    type: Number,
    required: true,
  },
  direction: {
    type: String,
    required: true,
    enum: ['up', 'down'],
  },
  computedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: 'topmovers',
});

*** End of file truncated as message too long***
```
