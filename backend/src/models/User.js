const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // Never return password in queries
  },
  profile: {
    displayName: { type: String, default: '' },
    avatar: { type: String, default: 'default' },
    country: { type: String, default: '' },
    targetReduction: { type: Number, default: 20 }, // % reduction goal
    targetDate: { type: Date, default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
  },
  gamification: {
    level: { type: Number, default: 1 },
    greenScore: { type: Number, default: 0 },
    badges: [{ type: String }],
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null }
  },
  isGuest: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get user level name
userSchema.methods.getLevelName = function () {
  const levels = [
    { min: 1, max: 1, name: 'Carbon Novice', icon: '🌱' },
    { min: 2, max: 3, name: 'Eco Learner', icon: '🌿' },
    { min: 4, max: 6, name: 'Green Enthusiast', icon: '🍃' },
    { min: 7, max: 10, name: 'Eco Warrior', icon: '🌳' },
    { min: 11, max: 15, name: 'Sustainability Champion', icon: '🌍' },
    { min: 16, max: Infinity, name: 'Carbon Hero', icon: '⚡🌍' }
  ];
  return levels.find(l => this.gamification.level >= l.min && this.gamification.level <= l.max) || levels[0];
};

module.exports = mongoose.model('User', userSchema);
