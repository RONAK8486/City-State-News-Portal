const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, admin, adminOrPublisher } = require('../middleware/auth');
const upload = require('../middleware/upload');

const {
  createNews,
  getAllNewsAdmin,
  getNewsById,
  updateNews,
  deleteNews,
  toggleFeatured,
  getDashboardStats,
  get5DayReport
} = require('../controllers/adminNewsController');

// Validation rules
const newsValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('category').isIn(['politics', 'business', 'technology', 'sports', 'entertainment', 'health', 'science', 'world', 'local'])
    .withMessage('Invalid category')
];

// All routes require at least authentication
router.use(protect);

// Dashboard stats - Admin only
router.get('/stats', admin, getDashboardStats);
router.get('/stats/5-days', admin, get5DayReport);

// News routes
router.route('/news')
  .get(admin, getAllNewsAdmin) // Only admin can see all news list
  .post(adminOrPublisher, newsValidation, validate, createNews); // Admin and Publisher can create

router.route('/news/:id')
  .get(adminOrPublisher, getNewsById) // Allow both to see single news (needed for edit if we allowed it, or just for verification)
  .put(admin, updateNews)
  .delete(admin, deleteNews);

router.patch('/news/:id/featured', admin, toggleFeatured);

// Upload image - Admin and Publisher
router.post('/upload', adminOrPublisher, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload an image'
    });
  }
  res.status(200).json({
    success: true,
    data: {
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`
    }
  });
});

module.exports = router;
