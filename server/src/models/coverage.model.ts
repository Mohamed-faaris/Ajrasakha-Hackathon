import mongoose from 'mongoose';

const coverageSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'current',
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
}, {
  collection: 'coverage',
});

export const Coverage = mongoose.model('Coverage', coverageSchema);