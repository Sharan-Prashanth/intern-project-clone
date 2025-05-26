const express = require('express');
const router = express.Router();
const multer = require('multer');
const feedbackController = require('../controllers/feedbackController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Add error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes with error handling
router.get('/', asyncHandler(feedbackController.getAllFeedbacks));
router.get('/tracking/:tracking_key', asyncHandler(feedbackController.getFeedbackByTrackingKey));
router.get('/user/:user_id', asyncHandler(feedbackController.getUserFeedbacks));
router.get('/assigned/:employee_id', asyncHandler(feedbackController.getAssignmentsForEmployee));
router.get('/responses/pending', asyncHandler(feedbackController.getPendingResponses));
router.get('/check-emp1', asyncHandler(feedbackController.checkEmployeeDetails));
router.get('/check-all-employees', asyncHandler(feedbackController.checkAllEmployeeAssignments));

router.post('/', upload.single('file'), asyncHandler(feedbackController.submitFeedback));
router.post('/assign', asyncHandler(feedbackController.assignToEmployee));
router.post('/response', asyncHandler(feedbackController.submitEmployeeResponse));
router.post('/response/review', asyncHandler(feedbackController.hodApproveResponse));

module.exports = router;
