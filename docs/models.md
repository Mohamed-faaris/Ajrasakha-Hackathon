# Database Models

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
const cropSchema = new mongoose.Schema({
  _id: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, required: true, uppercase: true, trim: true },
  commodityGroup: { type: String, trim: true },
});
```

### 2. State

```typescript
const stateSchema = new mongoose.Schema({
  _id: { type: String, required: true, uppercase: true, trim: true },// TN
  name: { type: String, required: true, lowercase: true, trim: true },// Tamil Nadu
  districts:[
    {
      _id: { type: String, required: true, uppercase: true, trim: true },//slug like chn
      name: { type: String, required: true, lowercase: true, trim: true },//display name like Chennai
    }
  ]
});
```




### 3. Mandi

```typescript
const mandiSchema = new mongoose.Schema({
  _id: { type: String, required: true, lowercase: true, trim: true },//slug
  name: { type: String, required: true, uppercase: true, trim: true },//display name
  stateId: { type: String, required: true, ref: "State" },// state code like TN
  stateName: { type: String, required: true, uppercase: true },// state display name like Tamil Nadu (denormalized)
  districtId: { type: String, trim: true, lowercase: true }, //chn
  districtName: { type: String, required: true, uppercase: true, trim: true },// Chennai
  apmcCode: { type: String, uppercase: true, trim: true },
  sourceMandiId: { type: String, trim: true, lowercase: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number]},
  },
});
```

### 4. Price

```typescript
const priceSchema = new mongoose.Schema({
  cropId: { type: String, required: true, ref: "Crop" },
  cropName: { type: String, required: true, uppercase: true },//denormalized
  mandiId: { type: String, required: true, ref: "Mandi" },
  mandiName: { type: String, required: true, uppercase: true },
  stateId: { type: String, required: true, ref: "State" },
  stateName: { type: String, required: true, uppercase: true },
  districtId: { type: String, trim: true, lowercase: true },
  districtName: { type: String, required: true, uppercase: true },
  date: { type: Date, required: true },
  minPrice: { type: Number, required: true, min: 0 },
  maxPrice: { type: Number, required: true, min: 0 },
  modalPrice: { type: Number, required: true, min: 0 },
  unit: { type: String, default: "Qui" },
  arrival: { type: Number, min: 0 },
  source: {
    type: String,
    trim: true,
    enum: ["agmarknet", "krishisarathi", "desamarket", "other"],// add more sources as needed
    default: "agmarknet",
  }
  sourceId: { type: String, trim: true },
  apmcCode: { type: String, uppercase: true, trim: true },
});
```

appendix: 
```typescript
  const soruceReferenceSchema = new mongoose.Schema({
    sourceName: { type: String, required: true, trim: true },
    sourceUrl: { type: String, required: true, trim: true },
    sourceLogo: { type: String, trim: true },
    description: { type: String, trim: true },
    metaData: { type: mongoose.Schema.Types.Mixed },
  });
```




### 5. UserProfile

```typescript
const notificationsChannelSchema = new mongoose.Schema({
  email: { type: Boolean, default: true },
  sms: { type: Boolean, default: false },
  whatsapp: { type: Boolean, default: false },
  push: { type: Boolean, default: true },
});

const userProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, ref: "user" },
  phone: { type: String, trim: true, match: [/^[6-9]\d{9}$/, "Invalid Indian phone number"] },
  email: { type: String, trim: true, lowercase: true, match: [/.+@.+\..+/, "Invalid email address"] },
  state: { type: String, trim: true, uppercase: true },
  district: { type: String, trim: true, uppercase: true },
  preferredCrops: [{ type: String }],
  preferredMandis: [{ type: String }],
  notificationPreferences: {
    priceAlerts: notificationsChannelSchema,
    marketNews: notificationsChannelSchema,
    weatherUpdates: notificationsChannelSchema,
  },
  
  language: { type: String, default: "en", enum: ["en", "hi", "mr", "te", "ta", "kn", "gu", "pa"] },
  avatar: { type: String },
  farmerDetails: {
    isFarmer: { type: Boolean, default: false },
    farmSize: { type: Number },
    farmLocation: { type: { type: String, enum: ["Point"] }, coordinates: { type: [Number] } },
    primaryCrops: [{ type: String }],
  },
  traderDetails: {
    isTrader: { type: Boolean, default: false },
    companyName: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    tradingStates: [{ type: String }],
  },
});
```

### 6. Alert

```typescript
const alertSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "user" },
  cropId: { type: String, required: true, ref: "Crop" },
  cropName: { type: String, required: true, uppercase: true },
  mandiId: { type: String, ref: "Mandi" },
  mandiName: { type: String, uppercase: true },
  thresholdPrice: { type: Number, required: true, min: 0 },
  direction: { type: String, required: true, enum: ["above", "below"] },
  isActive: { type: Boolean, default: true },
  triggeredAt: { type: Date },
  message: { type: String, trim: true },
});
```

### 7. TopMover (Cached)

```typescript
const topMoverSchema = new mongoose.Schema({
  cropId: { type: String, required: true, ref: "Crop" },
  cropName: { type: String, required: true, uppercase: true },
  latestPrice: { type: Number, required: true },
  previousPrice: { type: Number, required: true },
  changePct: { type: Number, required: true },
  direction: { type: String, required: true, enum: ["up", "down"] },
  computedAt: { type: Date, default: Date.now },
});
```

### 8. Coverage (Cached Singleton)

```typescript
const coverageSchema = new mongoose.Schema({
  _id: { type: String, default: "current" },
  totalApmcs: { type: Number, default: 0 },
  coveredApmcs: { type: Number, default: 0 },
  coveragePercent: { type: Number, default: 0 },
  statesCovered: { type: Number, default: 0 },
  totalPrices: { type: Number, default: 0 },
  latestDate: { type: Date },
  computedAt: { type: Date, default: Date.now },
});
```

### 9. PriceTrend (Cached)

```typescript
const priceTrendSchema = new mongoose.Schema({
  cacheKey: { type: String, required: true, unique: true },
  cropId: { type: String, required: true },
  mandiId: { type: String, required: true },
  stateId: { type: String },
  data: [{ date: { type: Date, required: true }, modalPrice: { type: Number, required: true } }],
  computedAt: { type: Date, default: Date.now },
});
```

### 10. MandiPrice (Cached for Map)

```typescript
const mandiPriceSchema = new mongoose.Schema({
  mandiId: { type: String, required: true, ref: "Mandi" },
  mandiName: { type: String, required: true, uppercase: true },
  cropId: { type: String, required: true, ref: "Mandi" },
  cropName: { type: String, uppercase: true },
  stateName: { type: String, required: true, uppercase: true },
  districtName: { type: String, uppercase: true },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true },
  },
  modalPrice: { type: Number, required: true },
  date: { type: Date, required: true },
  computedAt: { type: Date, default: Date.now },
});
```
