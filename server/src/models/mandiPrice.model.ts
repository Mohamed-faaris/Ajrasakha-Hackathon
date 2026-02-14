import mongoose from 'mongoose';

const mandiPriceSchema = new mongoose.Schema({
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
  modalPrice: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  cropName: {
    type: String,
    uppercase: true,
  },
  computedAt: {
    type: Date,
    default: Date.now,
    expires: 86400,
  },
}, {
  collection: 'mandiprices',
});

mandiPriceSchema.index({ location: '2dsphere' });
mandiPriceSchema.index({ stateName: 1 });

export const MandiPrice = mongoose.model('MandiPrice', mandiPriceSchema);