const express = require('express');
const router = express.Router();
const {
  getProgressOverview,
  getCandidateProgress,
  getTeamProgress,
  updateTaskProgress,
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getProgressOverview);
router.get('/candidates', getCandidateProgress);
router.get('/teams', getTeamProgress);
router.put('/:assignmentId', updateTaskProgress);

module.exports = router;