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
    tradingStates: [{
      type: String,
    }],
  },
}, {
  timestamps: true,
  collection: 'userprofiles',
});

userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ state: 1 });
userProfileSchema.index({ 'farmerDetails.farmLocation': '2dsphere' });

export const UserProfile = mongoose.model('UserProfile', userProfileSchema);