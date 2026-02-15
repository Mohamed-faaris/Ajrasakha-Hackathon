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

topMoverSchema.index({ computedAt: 1 }, { expireAfterSeconds: 86400 });
topMoverSchema.index({ direction: 1, changePct: -1 });

export const TopMover = mongoose.model('TopMover', topMoverSchema);