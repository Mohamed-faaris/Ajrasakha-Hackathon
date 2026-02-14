import mongoose from 'mongoose';

const mandiSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
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
    ref: 'State',
  },
  stateName: {
    type: String,
    required: true,
    uppercase: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  latitude: { type: Number },
  longitude: { type: Number },
}, {
  timestamps: true,
  collection: 'mandis',
});

mandiSchema.index({ stateId: 1 });
mandiSchema.index({ name: 1 });
mandiSchema.index({ location: '2dsphere' });

export const Mandi = mongoose.model('Mandi', mandiSchema);