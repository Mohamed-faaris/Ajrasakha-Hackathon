import mongoose from 'mongoose';

const cropSchema = new mongoose.Schema({
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
  commodityGroup: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
  collection: 'crops',
});

cropSchema.index({ name: 1 });
cropSchema.index({ commodityGroup: 1 });

export const Crop = mongoose.model('Crop', cropSchema);