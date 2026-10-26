const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
  caller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  callType: { 
    type: String, 
    enum: ['audio', 'video'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['missed', 'rejected', 'connected', 'busy'], 
    required: true 
  },
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  endedAt: { 
    type: Date, 
    default: null 
  },
  durationSeconds: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true 
});

// Index to query recent calls for a user efficiently
callLogSchema.index({ caller: 1, createdAt: -1 });
callLogSchema.index({ receiver: 1, createdAt: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);
