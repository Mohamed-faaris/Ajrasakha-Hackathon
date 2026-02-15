import mongoose from 'mongoose';

const priceTrendSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: true,
    unique: true,
  },
  cropId: { type: String, required: true },
  mandiId: { type: String, required: true },
  stateId: { type: String },
  data: [{
    date: { type: Date, required: true },
    modalPrice: { type: Number, required: true },
  }],
  computedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: 'pricetrends',
});

priceTrendSchema.index({ cropId: 1, mandiId: 1, stateId: 1 });
priceTrendSchema.index({ computedAt: 1 }, { expireAfterSeconds: 900 });

export const PriceTrend = mongoose.model('PriceTrend', priceTrendSchema);