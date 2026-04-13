const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News',
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['Misinformation', 'Hate Speech', 'Spam', 'Copyright Violation', 'Other'],
    required: true
  },
  description: {
    type: String,
    maxLength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed'],
    default: 'pending'
  }
}, { timestamps: true });

// Prevent duplicate reports from the same user for the same article
reportSchema.index({ article: 1, reporter: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
