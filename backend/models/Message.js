const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  customId: {
    type: String,
    index: true
  },
  chatId: { 
    type: String, 
    required: true, 
    index: true 
  },
  senderId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  sender: { 
    type: mongoose.Schema.Types.Mixed,
    ref: 'User'
  },
  receiver: { 
    type: mongoose.Schema.Types.Mixed,
    ref: 'User'
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  text: { 
    type: String, 
    trim: true,
    default: '' 
  },
  image: {
    type: String,
    default: null
  },
  mediaUrl: { 
    type: String, 
    default: null 
  },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'audio', 'call_record'], 
    default: 'text' 
  },
  timestamp: {
    type: String,
    default: () => new Date().toISOString()
  },
  // Delivery & Seen Lifecycle
  status: { 
    type: String, 
    enum: ['sent', 'delivered', 'read'], 
    default: 'sent' 
  },
  seen: {
    type: Boolean,
    default: false
  },
  readAt: { 
    type: Date, 
    default: null 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual 'id' getter
messageSchema.virtual('id').get(function () {
  return this.customId || this._id.toString();
});

// Sync aliases before saving
messageSchema.pre('save', function (next) {
  if (this.text && !this.message) this.message = this.text;
  if (this.message && !this.text) this.text = this.message;
  if (this.mediaUrl && !this.image) this.image = this.mediaUrl;
  if (this.image && !this.mediaUrl) this.mediaUrl = this.image;
  if (this.senderId && !this.sender) this.sender = this.senderId;
  if (this.receiverId && !this.receiver) this.receiver = this.receiverId;
  if (this.seen && this.status !== 'read') this.status = 'read';
  if (this.status === 'read') this.seen = true;
  next();
});

// Compound Index for pagination
messageSchema.index({ chatId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
