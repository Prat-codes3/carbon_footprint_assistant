const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['transport', 'energy', 'food', 'shopping']
  },
  activityType: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative']
  },
  unit: {
    type: String,
    required: true
  },
  co2Kg: {
    type: Number,
    required: true,
    min: 0
  },
  label: {
    type: String,
    required: true
  },
  note: {
    type: String,
    maxlength: 200,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient user + date queries
activitySchema.index({ userId: 1, date: -1 });
activitySchema.index({ userId: 1, category: 1, date: -1 });

module.exports = mongoose.model('Activity', activitySchema);
