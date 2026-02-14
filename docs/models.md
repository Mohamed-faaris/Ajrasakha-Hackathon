# Database Models & Architecture

## Overview

This document outlines the MongoDB models, caching strategy, and data flow for the Ajrasakha agricultural price intelligence system.

---

## Database Connection

Configure in `.env`:

```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/?appName=<app>
```

---

## Model Architecture

### Core Entities (Persisted)

| Model | Purpose | Collection |
|-------|---------|------------|
| **Crop** | Agricultural commodities | `crops` |
| **State** | Indian states | `states` |
| **Mandi** | Markets/APMCs | `mandis` |
| **Price** | Daily price records | `prices` |
| **Alert** | User price alerts | `alerts` |

### Auth Entities (Better Auth Managed)

| Collection | Purpose |
|------------|---------|
| `user` | User accounts |
| `session` | Active sessions |
| `account` | OAuth accounts |
| `verification` | Email verification tokens |

### Computed/Cache Entities

| Model | Purpose | Strategy |
|-------|---------|----------|
| **TopMover** | Price gainers/losers | Cached daily, TTL 24h |
| **Coverage** | System coverage stats | Cached hourly, TTL 1h |
| **PriceTrend** | Historical price trends | Cached per query, TTL 15min |
| **MandiPrice** | Map visualization data | Cached daily, TTL 24h |

---

## Model Schemas

### 1. Crop

```typescript
// server/src/models/crop.model.ts
import mongoose from 'mongoose';

const cropSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
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
}, {
  timestamps: true,
  collection: 'crops',
});

// Indexes
cropSchema.index({ name: 1 });
cropSchema.index({ commodityGroup: 1 });

export const Crop = mongoose.model('Crop', cropSchema);
```

---

### 2. State

```typescript
// server/src/models/state.model.ts
import mongoose from 'mongoose';

const stateSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    // e.g., "rajasthan", "madhya-pradesh"
  },
  name: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    // e.g., "RAJASTHAN", "MADHYA PRADESH"
  },
  code: {
    type: String,
    uppercase: true,
    trim: true,
    // e.g., "RJ", "MP"
  },
}, {
  timestamps: true,
  collection: 'states',
});

// Indexes
stateSchema.index({ name: 1 });
stateSchema.index({ code: 1 });

export const State = mongoose.model('State', stateSchema);
```

---

### 3. Mandi

```typescript
// server/src/models/mandi.model.ts
import mongoose from 'mongoose';

const mandiSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
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
    ref: 'State',
    // Reference to state.id (not ObjectId)
  },
  stateName: {
    type: String,
    required: true,
    uppercase: true,
    // Denormalized for queries
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  // Legacy flat fields for backward compatibility
  latitude: { type: Number },
  longitude: { type: Number },
}, {
  timestamps: true,
  collection: 'mandis',
});

// Indexes
mandiSchema.index({ stateId: 1 });
mandiSchema.index({ name: 1 });
mandiSchema.index({ location: '2dsphere' }); // Geo queries

export const Mandi = mongoose.model('Mandi', mandiSchema);
```

---

### 4. Price (Core Entity)

```typescript
// server/src/models/price.model.ts
import mongoose from 'mongoose';

const priceSchema = new mongoose.Schema({
  // Composite unique ID: `${source}-${date}-${cropId}-${mandiId}`
  id: {
    type: String,
    required: true,
    unique: true,
  },
  // Crop reference
  cropId: {
    type: String,
    required: true,
    ref: 'Crop',
  },
  cropName: {
    type: String,
    required: true,
    uppercase: true,
    // Denormalized
  },
  // Mandi reference
  mandiId: {
    type: String,
    required: true,
    ref: 'Mandi',
  },
  mandiName: {
    type: String,
    required: true,
    uppercase: true,
    // Denormalized
  },
  // State reference
  stateId: {
    type: String,
    required: true,
    ref: 'State',
  },
  stateName: {
    type: String,
    required: true,
    uppercase: true,
    // Denormalized
  },
  // Price data
  date: {
    type: Date,
    required: true,
  },
  minPrice: {
    type: Number,
    required: true,
    min: 0,
    // Rs./Quintal
  },
  maxPrice: {
    type: Number,
    required: true,
    min: 0,
    // Rs./Quintal
  },
  modalPrice: {
    type: Number,
    required: true,
    min: 0,
    // Rs./Quintal - most common price
  },
  unit: {
    type: String,
    default: 'Qui',
    // e.g., "Qui" (Quintal), "Nos" (Numbers)
  },
  arrival: {
    type: Number,
    min: 0,
    // Quantity arrived in market
  },
  source: {
    type: String,
    enum: ['agmarknet', 'enam', 'apmc', 'other'],
    default: 'other',
  },
  sourceId: {
    type: String,
    // Original ID from source system
  },
}, {
  timestamps: true,
  collection: 'prices',
});

// Indexes for common queries
priceSchema.index({ date: -1 });
priceSchema.index({ cropId: 1, date: -1 });
priceSchema.index({ mandiId: 1, date: -1 });
priceSchema.index({ stateId: 1, date: -1 });
priceSchema.index({ cropId: 1, mandiId: 1, date: -1 });
priceSchema.index({ source: 1, date: -1 });

// Compound index for deduplication
priceSchema.index({ source: 1, date: 1, cropId: 1, mandiId: 1 }, { unique: true });

export const Price = mongoose.model('Price', priceSchema);
```

---

### 5. UserProfile

```typescript
// server/src/models/userProfile.model.ts
import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'user',
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Invalid Indian phone number'],
  },
  state: {
    type: String,
    trim: true,
    uppercase: true,
    // Primary state of interest
  },
  district: {
    type: String,
    trim: true,
    uppercase: true,
  },
  preferredCrops: [{
    type: String,
    // Array of crop IDs user is interested in
  }],
  preferredMandis: [{
    type: String,
    // Array of mandi IDs user tracks
  }],
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
    default: 'en',
    enum: ['en', 'hi', 'mr', 'te', 'ta', 'kn', 'gu', 'pa'],
  },
  avatar: {
    type: String,
    // URL to avatar image
  },
  farmerDetails: {
    isFarmer: { type: Boolean, default: false },
    farmSize: { type: Number }, // in acres
    farmLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    primaryCrops: [{
      type: String,
    }],
  },
  traderDetails: {
    isTrader: { type: Boolean, default: false },
    companyName: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    tradingStates: [{
      type: String,
    }],
  },
}, {
  timestamps: true,
  collection: 'userprofiles',
});

// Indexes
userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ state: 1 });
userProfileSchema.index({ 'farmerDetails.farmLocation': '2dsphere' });

export const UserProfile = mongoose.model('UserProfile', userProfileSchema);
```

---

### 6. Alert

```typescript
// server/src/models/alert.model.ts
import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString(),
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'user',
  },
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
  mandiId: {
    type: String,
    ref: 'Mandi',
    // Optional - if null, alert applies to all mandis
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
    enum: ['above', 'below'],
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
}, {
  timestamps: true,
  collection: 'alerts',
});

// Indexes
alertSchema.index({ userId: 1, isActive: 1 });
alertSchema.index({ cropId: 1, isActive: 1 });
alertSchema.index({ mandiId: 1, isActive: 1 });

export const Alert = mongoose.model('Alert', alertSchema);
```

---

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
    // Percentage change
  },
  direction: {
    type: String,
    required: true,
    enum: ['up', 'down'],
  },
  computedAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // TTL: 24 hours
  },
}, {
  collection: 'topmovers',
});

// Index
topMoverSchema.index({ direction: 1, changePct: -1 });

export const TopMover = mongoose.model('TopMover', topMoverSchema);
```

---

### 8. Coverage (Cached Singleton)

```typescript
// server/src/models/coverage.model.ts
import mongoose from 'mongoose';

const coverageSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'current', // Singleton pattern
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
    expires: 3600, // TTL: 1 hour
  },
}, {
  collection: 'coverage',
});

export const Coverage = mongoose.model('Coverage', coverageSchema);
```

---

### 9. PriceTrend (Cached)

```typescript
// server/src/models/priceTrend.model.ts
import mongoose from 'mongoose';

const priceTrendSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: true,
    unique: true,
    // Format: `${cropId}:${mandiId}:${days}`
  },
  cropId: { type: String, required: true },
  mandiId: { type: String, required: true },
  data: [{
    date: { type: Date, required: true },
    modalPrice: { type: Number, required: true },
  }],
  computedAt: {
    type: Date,
    default: Date.now,
    expires: 900, // TTL: 15 minutes
  },
}, {
  collection: 'pricetrends',
});

priceTrendSchema.index({ cropId: 1, mandiId: 1 });

export const PriceTrend = mongoose.model('PriceTrend', priceTrendSchema);
```

---

### 10. MandiPrice (Cached for Map)

```typescript
// server/src/models/mandiPrice.model.ts
import mongoose from 'mongoose';

const mandiPriceSchema = new mongoose.Schema({
  mandiId: {
    type: String,
    required: true,
    ref: 'Mandi',
  },
  mandiName: {
    type: String,
    required: true,
    uppercase: true,
  },
  stateName: {
    type: String,
    required: true,
    uppercase: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
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
  cropName: {
    type: String,
    uppercase: true,
  },
  computedAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // TTL: 24 hours
  },
}, {
  collection: 'mandiprices',
});

mandiPriceSchema.index({ location: '2dsphere' });
mandiPriceSchema.index({ stateName: 1 });

export const MandiPrice = mongoose.model('MandiPrice', mandiPriceSchema);
```

---

## Cache Strategy

### TTL-Based Expiration

| Collection | TTL | Refresh Trigger |
|------------|-----|-----------------|
| `topmovers` | 24h | Daily cron job |
| `coverage` | 1h | Hourly cron job |
| `pricetrends` | 15min | On-demand with cache-aside |
| `mandiprices` | 24h | Daily cron job |

### Cache Invalidation

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE INVALIDATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  New Price Data Ingress                                      │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────────┐    │
│  │ Price   │───▶│ Invalidate   │───▶│ Recompute       │    │
│  │ Insert  │    │ Related Cache│    │ On Next Request │    │
│  └─────────┘    └──────────────┘    └─────────────────┘    │
│                                                              │
│  TTL handles automatic expiration                            │
│  Manual invalidation for:                                    │
│    - Coverage: when new mandi/price added                    │
│    - TopMovers: when prices change significantly             │
│    - MandiPrice: when new prices for mandi                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Cache-Aside Pattern

```typescript
// Example: Getting price trends
async function getPriceTrends(cropId: string, mandiId: string, days: number) {
  const cacheKey = `${cropId}:${mandiId}:${days}`;
  
  // 1. Check cache
  let cached = await PriceTrend.findOne({ cacheKey });
  if (cached) return cached.data;
  
  // 2. Compute if not cached
  const data = await computeTrends(cropId, mandiId, days);
  
  // 3. Store in cache
  await PriceTrend.create({ cacheKey, cropId, mandiId, data });
  
  return data;
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
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
│       │ (24h TTL)│ │ (1h TTL) │ │ (24h TTL)│                    │
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
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Query Patterns

### Most Common Queries

| Query | Index Used | Notes |
|-------|-----------|-------|
| Latest prices by crop | `{ cropId: 1, date: -1 }` | Paginated |
| Prices by mandi + date range | `{ mandiId: 1, date: -1 }` | Filter by date |
| Prices by state + crop | `{ stateId: 1, cropId: 1, date: -1 }` | Dashboard |
| Map mandis in bounds | `{ location: '2dsphere' }` | Geo query |
| Top movers (up/down) | `{ direction: 1, changePct: -1 }` | Sorted |
| User alerts | `{ userId: 1, isActive: 1 }` | User profile |

### Example Queries

```typescript
// Latest prices for a crop
Price.find({ cropId: 'wheat' })
  .sort({ date: -1 })
  .limit(20);

// Prices in date range for mandi
Price.find({
  mandiId: 'kota-rajasthan',
  date: { $gte: startDate, $lte: endDate }
}).sort({ date: -1 });

// Mandis within map bounds
Mandi.find({
  location: {
    $geoWithin: {
      $box: [[minLng, minLat], [maxLng, maxLat]]
    }
  }
});

// Top gainers
TopMover.find({ direction: 'up' })
  .sort({ changePct: -1 })
  .limit(10);
```

---

## File Structure

```
server/src/models/
├── index.ts           # Export all models
├── crop.model.ts      # Crop schema
├── state.model.ts     # State schema
├── mandi.model.ts     # Mandi schema
├── price.model.ts     # Price schema (core)
├── userProfile.model.ts # Extended user profiles
├── alert.model.ts     # User alerts
├── topMover.model.ts  # Cached top movers
├── coverage.model.ts  # Cached coverage stats
├── priceTrend.model.ts # Cached trends
└── mandiPrice.model.ts # Cached map data
```

---

## Migration Notes

1. **Existing Data**: If MongoDB already has data, schemas will adapt automatically
2. **Indexes**: Run `ensureIndexes()` on first server start
3. **Better Auth**: Collections `user`, `session`, `account`, `verification` are auto-created
4. **Geo Indexes**: Require `location` field with `type: 'Point'` and `[lng, lat]` order