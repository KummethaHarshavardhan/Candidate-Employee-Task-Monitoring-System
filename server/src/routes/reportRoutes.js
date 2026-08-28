const express = require('express');
const router = express.Router();
const {
  getOverviewReport,
  getCandidatePerformanceReport,
  getTeamPerformanceReport,
  getTaskWiseReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/overview', getOverviewReport);
router.get('/candidates', getCandidatePerformanceReport);
router.get('/teams', getTeamPerformanceReport);
router.get('/tasks', getTaskWiseReport);

module.exports = router;