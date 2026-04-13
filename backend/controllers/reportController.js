const Report = require('../models/Report');
const News = require('../models/News');
const fs = require('fs');
const path = require('path');

// @desc    Create a report
// @route   POST /api/reports/:newsId
// @access  Private
exports.createReport = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const { newsId } = req.params;

    // Check if news article exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Checking for duplicate report is handled by the unique index, 
    // but doing an explicit check for a better error message
    const existingReport = await Report.findOne({ article: newsId, reporter: req.user._id });
    if (existingReport) {
      return res.status(400).json({ success: false, message: 'You have already reported this article' });
    }

    const report = await Report.create({
      article: newsId,
      reporter: req.user._id,
      reason,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Thank you. Your report has been submitted.',
      data: report
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
       return res.status(400).json({ success: false, message: 'You have already reported this article' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all reports (Admin)
// @route   GET /api/reports
// @access  Private/Admin
exports.getReportsAdmin = async (req, res) => {
  try {
    const { status, reason, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (reason) query.reason = reason;

    const startIndex = (page - 1) * limit;

    const reportCount = await Report.countDocuments(query);
    const totalPages = Math.ceil(reportCount / limit);

    const reports = await Report.find(query)
      .populate('article', 'title slug image')
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
// @route   PUT /api/reports/:id/status
// @access  Private/Admin
exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'reviewed', 'dismissed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const report = await Report.findByIdAndUpdate(
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

// @desc    Remove reported article (Admin)
// @route   DELETE /api/reports/:newsId/article
// @access  Private/Admin
exports.removeReportedArticle = async (req, res) => {
  try {
    const { newsId } = req.params;

    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Delete image file if exists
    if (news.image && news.image.startsWith('/uploads/')) {
        const imagePath = path.join(__dirname, '..', news.image);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }
    }

    await News.findByIdAndDelete(newsId);

    // Update related reports to "reviewed" as the article is now handled
    await Report.updateMany(
      { article: newsId, status: 'pending' },
      { status: 'reviewed' }
    );

    res.status(200).json({
      success: true,
      message: 'Article removed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
