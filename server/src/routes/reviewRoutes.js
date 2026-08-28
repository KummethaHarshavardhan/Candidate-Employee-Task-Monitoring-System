const express = require('express');
const router = express.Router();
const {
  getReviewQueue,
  getReviewById,
  approveSubmission,
  reworkSubmission,
  getAssignmentReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/pending', authorize('ADMIN', 'REVIEWER'), getReviewQueue);
router.get('/assignment/:assignmentId', getAssignmentReviews);
router.get('/:id', getReviewById);
router.post('/:submissionId/approve', authorize('ADMIN', 'REVIEWER'), approveSubmission);
router.post('/:submissionId/rework', authorize('ADMIN', 'REVIEWER'), reworkSubmission);

module.exports = router;