import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'user',
  },
  role: {
    type: String,
    enum: ['farmer', 'trader', 'policy_maker', 'agri_startup'],
    default: 'farmer',
    required: true,
    index: true,
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
  },
  district: {
    type: String,
    trim: true,
    uppercase: true,
  },
  preferredCrops: [{
    type: String,
  }],
  preferredMandis: [{
    type: String,
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
  },
  farmerDetails: {
    isFarmer: { type: Boolean, default: false },
    farmSize: { type: Number },
    farmLocation: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
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
  policyMakerDetails: {
    organization: { type: String, trim: true },
    designation: { type: String, trim: true },
    policyFocusAreas: [{
      type: String,
    }],
  },
  agriStartupDetails: {
    startupName: { type: String, trim: true },
    stage: {
      type: String,
      enum: ['idea', 'mvp', 'early', 'growth', 'scale'],
    },
    focusAreas: [{
      type: String,
    }],
  },
  classification: {
    method: {
      type: String,
      enum: ['self_declared', 'rule_based'],
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    evaluatedAt: {
      type: Date,
    },
  },
}, {
  timestamps: true,
  collection: 'userprofiles',
});

userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ state: 1 });
userProfileSchema.index({ 'farmerDetails.farmLocation': '2dsphere' });

export const UserProfile = mongoose.model('UserProfile', userProfileSchema);
