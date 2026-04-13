const CommentReport = require('../models/CommentReport');
const Comment = require('../models/Comment');
const User = require('../models/User');

// @desc    Create a comment report
// @route   POST /api/comment-reports/:commentId
// @access  Private
exports.createCommentReport = async (req, res) => {
  try {
    const { reason, note } = req.body;
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check duplicate exactly
    const existingReport = await CommentReport.findOne({ comment: commentId, reporter: req.user._id });
    if (existingReport) {
      return res.status(400).json({ success: false, message: 'You have already reported this comment' });
    }

    const report = await CommentReport.create({
      comment: commentId,
      reporter: req.user._id,
      reason,
      note
    });

    // Increment comment report count
    comment.reportCount += 1;
    if (comment.reportCount >= 5) {
      comment.isUnderReview = true;
    }
    await comment.save();

    res.status(201).json({
      success: true,
      message: 'Thank you. Your report has been submitted.',
      data: report
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reported this comment' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all comment reports (Admin)
// @route   GET /api/comment-reports
// @access  Private/Admin
exports.getCommentReports = async (req, res) => {
  try {
    const { status, reason, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;

    const startIndex = (page - 1) * limit;

    const reportCount = await CommentReport.countDocuments(query);
    const totalPages = Math.ceil(reportCount / limit);

    const reports = await CommentReport.find(query)
      .populate({
        path: 'comment',
        select: 'content user news isUnderReview reportCount',
        populate: {
            path: 'user',
            select: 'name email avatar warningCount isBanned'
        }
      })
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalPages,
        totalItems: reportCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update report status (Admin)
// @route   PUT /api/comment-reports/:id/status
// @access  Private/Admin
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'reviewed', 'dismissed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const report = await CommentReport.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({
      success: true,
      message: `Report marked as ${status}`,
      data: report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Remove reported comment (Admin)
// @route   DELETE /api/comment-reports/:commentId/comment
// @access  Private/Admin
exports.deleteReportedComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Delete all replies explicitly
    await Comment.deleteMany({ parentComment: commentId });
    await Comment.findByIdAndDelete(commentId);

    // Update related reports to "reviewed"
    await CommentReport.updateMany(
      { comment: commentId, status: 'pending' },
      { status: 'reviewed' }
    );

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Warn user based on comment (Admin)
// @route   POST /api/comment-reports/user/:userId/warn
// @access  Private/Admin
exports.warnUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
       return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.warningCount += 1;
    await user.save();

    res.status(200).json({ 
        success: true, 
        message: `User warned. Total warnings: ${user.warningCount}`,
        warningCount: user.warningCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Ban user (Admin)
// @route   POST /api/comment-reports/user/:userId/ban
// @access  Private/Admin
exports.banUser = async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
         return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      user.isBanned = true;
      await user.save();
  
      // Dismiss all pending comment reports associated with the offending user's comments
      const userComments = await Comment.find({ user: userId }).select('_id');
      const userCommentIds = userComments.map(c => c._id);
      
      await CommentReport.updateMany(
        { comment: { $in: userCommentIds }, status: 'pending' },
        { status: 'reviewed' }
      );
  
      res.status(200).json({ success: true, message: 'User has been banned directly.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  };
