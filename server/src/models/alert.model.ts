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

alertSchema.index({ userId: 1, isActive: 1 });
alertSchema.index({ cropId: 1, isActive: 1 });
alertSchema.index({ mandiId: 1, isActive: 1 });

export const Alert = mongoose.model('Alert', alertSchema);