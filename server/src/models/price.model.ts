import mongoose from 'mongoose';

const priceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
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
    required: true,
    ref: 'Mandi',
  },
  mandiName: {
    type: String,
    required: true,
    uppercase: true,
  },
  stateId: {
    type: String,
    required: true,
    ref: 'State',
  },
  stateName: {
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
    default: 'Qui',
  },
  arrival: {
    type: Number,
    min: 0,
  },
  source: {
    type: String,
    enum: ['agmarknet', 'enam', 'apmc', 'other'],
    default: 'other',
  },
  sourceId: {
    type: String,
  },
}, {
  timestamps: true,
  collection: 'prices',
});

priceSchema.index({ date: -1 });
priceSchema.index({ cropId: 1, date: -1 });
priceSchema.index({ mandiId: 1, date: -1 });
priceSchema.index({ stateId: 1, date: -1 });
priceSchema.index({ cropId: 1, mandiId: 1, date: -1 });
priceSchema.index({ source: 1, date: -1 });
priceSchema.index({ source: 1, date: 1, cropId: 1, mandiId: 1 }, { unique: true });

export const Price = mongoose.model('Price', priceSchema);