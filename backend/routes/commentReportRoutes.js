const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const {
  createCommentReport,
  getCommentReports,
  updateReportStatus,
  deleteReportedComment,
  warnUser,
  banUser
} = require('../controllers/commentReportController');

const reportValidation = [
  body('reason')
    .isIn(['Spam', 'Abusive/Hate Speech', 'Harassment', 'Off-topic', 'Other'])
    .withMessage('Invalid reason'),
  body('note')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Note must be less than 200 characters')
];

// User route
router.post('/:commentId', protect, reportValidation, validate, createCommentReport);

// Admin routes
router.get('/', protect, admin, getCommentReports);
router.put('/:id/status', protect, admin, updateReportStatus);
router.delete('/:commentId/comment', protect, admin, deleteReportedComment);
router.post('/user/:userId/warn', protect, admin, warnUser);
router.post('/user/:userId/ban', protect, admin, banUser);

module.exports = router;
