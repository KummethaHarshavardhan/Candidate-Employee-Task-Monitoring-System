const express = require('express');
const router = express.Router();
const {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  reassignAssignment,
} = require('../controllers/assignmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', getAssignments);
router.get('/:id', getAssignmentById);
router.post('/', authorize('ADMIN', 'REVIEWER'), createAssignment);
router.put('/:id', authorize('ADMIN', 'REVIEWER'), updateAssignment);
router.put('/:id/reassign', authorize('ADMIN', 'REVIEWER'), reassignAssignment);

module.exports = router;
