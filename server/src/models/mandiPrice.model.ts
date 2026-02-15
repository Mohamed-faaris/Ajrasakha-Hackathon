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
  cropId: {
    type: String,
    required: true,
    ref: 'Crop',
  },
  stateName: {
    type: String,
    required: true,
    uppercase: true,
  },
  districtName: {
    type: String,
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
  },
}, {
  collection: 'mandiprices',
});

mandiPriceSchema.index({ location: '2dsphere' });
mandiPriceSchema.index({ stateName: 1 });
mandiPriceSchema.index({ mandiId: 1, cropId: 1, date: -1 });
mandiPriceSchema.index({ computedAt: 1 }, { expireAfterSeconds: 86400 });

export const MandiPrice = mongoose.model('MandiPrice', mandiPriceSchema);