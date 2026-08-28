const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(protect);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', authorize('ADMIN', 'REVIEWER'), createTask);
router.put('/:id', authorize('ADMIN', 'REVIEWER'), updateTask);
router.delete('/:id', authorize('ADMIN'), deleteTask);

module.exports = router;
