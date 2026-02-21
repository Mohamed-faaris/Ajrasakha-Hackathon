import mongoose from "mongoose";

// 1. Crop Schema
const cropSchema = new mongoose.Schema(
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
    commodityGroup: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "crops",
  }
);

cropSchema.index({ name: 1 });
cropSchema.index({ commodityGroup: 1 });

export const Crop = mongoose.model("Crop", cropSchema);

// 2. State Schema
const stateSchema = new mongoose.Schema(
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
    code: {
      type: String,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "states",
  }
);

stateSchema.index({ name: 1 });
stateSchema.index({ code: 1 });

export const State = mongoose.model("State", stateSchema);

// 3. Mandi Schema
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
      },
    },
  },
  {
    timestamps: true,
    collection: "mandis",
  }
);

mandiSchema.index({ stateId: 1 });
mandiSchema.index({ districtId: 1 });
mandiSchema.index({ name: 1 });
mandiSchema.index({ location: "2dsphere" });
mandiSchema.index({ sourceMandiId: 1 });

export const Mandi = mongoose.model("Mandi", mandiSchema);

// 4. Price Schema
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
  }
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
  { unique: true }
);

export const Price = mongoose.model("Price", priceSchema);

// 5. UserProfile Schema
const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      ref: "user",
    },
    role: {
      type: String,
      enum: ["farmer", "trader", "policy_maker", "agri_startup"],
      default: "farmer",
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
    policyMakerDetails: {
      organization: { type: String, trim: true },
      designation: { type: String, trim: true },
      policyFocusAreas: [
        {
          type: String,
        },
      ],
    },
    agriStartupDetails: {
      startupName: { type: String, trim: true },
      stage: {
        type: String,
        enum: ["idea", "mvp", "early", "growth", "scale"],
      },
      focusAreas: [
        {
          type: String,
        },
      ],
    },
  },
  {
    timestamps: true,
    collection: "userprofiles",
  }
);

userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ state: 1 });
userProfileSchema.index({ "farmerDetails.farmLocation": "2dsphere" });

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);

// 6. Alert Schema
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
  }
);

alertSchema.index({ userId: 1, isActive: 1 });
alertSchema.index({ cropId: 1, isActive: 1 });
alertSchema.index({ mandiId: 1, isActive: 1 });

export const Alert = mongoose.model("Alert", alertSchema);

// 7. TopMover Schema (Cached)
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
  }
);

topMoverSchema.index({ computedAt: 1 }, { expireAfterSeconds: 86400 });
topMoverSchema.index({ direction: 1, changePct: -1 });

export const TopMover = mongoose.model("TopMover", topMoverSchema);

// 8. Coverage Schema (Cached Singleton)
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
  }
);

export const Coverage = mongoose.model("Coverage", coverageSchema);

// 9. PriceTrend Schema (Cached)
const priceTrendSchema = new mongoose.Schema(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
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
  }
);

priceTrendSchema.index({ cropId: 1, mandiId: 1, stateId: 1 });
priceTrendSchema.index({ computedAt: 1 }, { expireAfterSeconds: 900 });

export const PriceTrend = mongoose.model("PriceTrend", priceTrendSchema);

// 10. MandiPrice Schema (Cached for Map)
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
  }
);

mandiPriceSchema.index({ location: "2dsphere" });
mandiPriceSchema.index({ stateName: 1 });
mandiPriceSchema.index({ mandiId: 1, cropId: 1, date: -1 });
mandiPriceSchema.index({ computedAt: 1 }, { expireAfterSeconds: 86400 });

export const MandiPrice = mongoose.model("MandiPrice", mandiPriceSchema);
