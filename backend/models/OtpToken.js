const mongoose = require('mongoose');

const otpTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  otpHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // MongoDB TTL — auto-delete after expiry
  },
  attempts: {
    type: Number,
    default: 0
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  // Rate limiting: track how many OTPs sent in current hour window
  requestCount: {
    type: Number,
    default: 1
  },
  windowStart: {
    type: Date,
    default: Date.now
  },
  // For audit log
  ipAddress: {
    type: String,
    default: ''
  },
  // Short-lived reset token returned after OTP verified
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OtpToken', otpTokenSchema);
