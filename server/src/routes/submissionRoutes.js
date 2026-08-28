const express = require('express');
const router = express.Router();
const {
  getSubmissions,
  getSubmissionById,
  createSubmission,
} = require('../controllers/submissionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getSubmissions);
router.get('/:id', getSubmissionById);
router.post('/', createSubmission);

module.exports = router;