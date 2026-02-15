import mongoose from 'mongoose';

const stateSchema = new mongoose.Schema({
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
  code: {
    type: String,
    uppercase: true,
    trim: true,
  },
}, {
  timestamps: true,
  collection: 'states',
});

stateSchema.index({ name: 1 });
stateSchema.index({ code: 1 });

export const State = mongoose.model('State', stateSchema);