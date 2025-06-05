const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const feedbackController = require('../controllers/feedbackController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, PDF and Word documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Add error handliing middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes with error handling
router.get('/', asyncHandler(feedbackController.getAllFeedbacks));
router.get('/tracking/:tracking_key', asyncHandler(feedbackController.getFeedbackByTrackingKey));
router.get('/user/:user_id', asyncHandler(feedbackController.getUserFeedbacks));
router.get('/assigned/:employee_id', asyncHandler(feedbackController.getAssignmentsForEmployee));
router.get('/assigned/all', asyncHandler(feedbackController.getAllAssignedFeedbacks));
router.get('/responses/pending', asyncHandler(feedbackController.getPendingResponses));
router.get('/check-emp1', asyncHandler(feedbackController.checkEmployeeDetails));
router.get('/check-all-employees', asyncHandler(feedbackController.checkAllEmployeeAssignments));
router.get('/report', asyncHandler(feedbackController.getReportByDateRange));

router.post('/', upload.single('file'), asyncHandler(feedbackController.submitFeedback));
router.post('/assign', asyncHandler(feedbackController.assignToEmployee));
router.post('/response', asyncHandler(feedbackController.submitEmployeeResponse));
router.post('/response/review', asyncHandler(feedbackController.hodApproveResponse));

// Error handling middleware for multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;
