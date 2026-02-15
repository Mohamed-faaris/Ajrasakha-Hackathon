import mongoose from 'mongoose';

const mandiSchema = new mongoose.Schema({
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
    ref: 'State',
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
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
}, {
  timestamps: true,
  collection: 'mandis',
});

mandiSchema.index({ stateId: 1 });
mandiSchema.index({ districtId: 1 });
mandiSchema.index({ name: 1 });
mandiSchema.index({ location: '2dsphere' });
mandiSchema.index({ sourceMandiId: 1 });

export const Mandi = mongoose.model('Mandi', mandiSchema);