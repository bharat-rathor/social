const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  customId: {
    type: String,
    index: true
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'], 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true 
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'], 
    select: false
  },
  age: { 
    type: Number, 
    min: 18, 
    max: 100 
  },
  gender: { 
    type: String, 
    default: 'Other'
  },
  preference: {
    type: String,
    default: 'All'
  },
  area: {
    type: String,
    default: ''
  },
  city: { 
    type: String, 
    index: true,
    default: ''
  },
  bio: { 
    type: String, 
    maxLength: 500, 
    default: '' 
  },
  interests: [{ 
    type: String, 
    index: true 
  }],
  avatar: { 
    type: String, 
    default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80' 
  },
  image: {
    type: String
  },
  
  // Privacy & Private Album Access
  album: [{ type: String }],
  privateAlbum: [{ type: String }],
  approvedViewers: [{ 
    type: mongoose.Schema.Types.Mixed, 
    ref: 'User' 
  }],
  
  // Subscription & Monetization Tier
  isPremium: {
    type: Boolean,
    default: false
  },
  subscription: {
    plan: { 
      type: String, 
      enum: ['free', 'standard', 'vip_gold'], 
      default: 'free' 
    },
    isPremium: { 
      type: Boolean, 
      default: false 
    },
    startDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null }
  },

  // Social Interaction Graph
  likesSent: [{ type: mongoose.Schema.Types.Mixed }],
  likesReceived: [{ type: mongoose.Schema.Types.Mixed }],
  blockedUsers: [{ type: mongoose.Schema.Types.Mixed }],

  // Presence & Activity
  online: {
    type: Boolean,
    default: false
  },
  isOnline: { 
    type: Boolean, 
    default: false 
  },
  lastSeen: { 
    type: Date, 
    default: Date.now 
  },
  isProfileComplete: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual 'id' getter that prefers customId or string _id
userSchema.virtual('id').get(function () {
  return this.customId ? (isNaN(Number(this.customId)) ? this.customId : Number(this.customId)) : this._id.toString();
});

// Pre-save hook: Hash password with bcrypt before saving if modified
userSchema.pre('save', async function (next) {
  if (this.avatar && !this.image) this.image = this.avatar;
  if (this.image && !this.avatar) this.avatar = this.image;
  if (this.online !== undefined) this.isOnline = this.online;
  if (this.isOnline !== undefined) this.online = this.isOnline;

  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (this.password === enteredPassword) return true; // plain text fallback for demo accounts
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
