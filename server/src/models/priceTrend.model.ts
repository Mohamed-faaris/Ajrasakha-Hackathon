import mongoose from 'mongoose';

const priceTrendSchema = new mongoose.Schema({
  cacheKey: {
    type: String,
    required: true,
    unique: true,
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
    expires: 900,
  },
}, {
  collection: 'pricetrends',
});

priceTrendSchema.index({ cropId: 1, mandiId: 1 });

export const PriceTrend = mongoose.model('PriceTrend', priceTrendSchema);