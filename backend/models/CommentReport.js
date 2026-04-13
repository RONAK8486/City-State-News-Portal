const mongoose = require('mongoose');

const commentReportSchema = new mongoose.Schema({
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['Spam', 'Abusive/Hate Speech', 'Harassment', 'Off-topic', 'Other'],
    required: true
  },
  note: {
    type: String,
    maxLength: 200
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'dismissed'],
    default: 'pending'
  }
}, { timestamps: true });

// Prevent duplicate reports on the same comment exactly
commentReportSchema.index({ comment: 1, reporter: 1 }, { unique: true });

module.exports = mongoose.model('CommentReport', commentReportSchema);
