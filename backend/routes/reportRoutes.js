const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const {
  createReport,
  getReportsAdmin,
  updateReportStatus,
  removeReportedArticle
} = require('../controllers/reportController');

// Validation rules
const reportValidation = [
  body('reason')
    .isIn(['Misinformation', 'Hate Speech', 'Spam', 'Copyright Violation', 'Other'])
    .withMessage('Invalid reason'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

// User routes (Requires authentication)
router.post('/:newsId', protect, reportValidation, validate, createReport);

// Admin routes (Requires authentication and admin role)
router.get('/', protect, admin, getReportsAdmin);
router.put('/:id/status', protect, admin, updateReportStatus);
router.delete('/:newsId/article', protect, admin, removeReportedArticle);

module.exports = router;
