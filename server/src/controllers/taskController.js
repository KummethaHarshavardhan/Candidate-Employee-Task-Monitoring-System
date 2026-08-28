const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const { calculateDeadlineStatus } = require('../utils/calculateDeadlineStatus');
const { notifyProjectAssigned } = require('../utils/notificationService');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const { search, priority, page = 1, limit = 50 } = req.query;

    const query = {};
    if (priority) query.priority = priority;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }

    if (req.user.role === 'CANDIDATE') {
      if (!req.user.candidateId) {
        return successResponse(res, 200, 'Tasks retrieved successfully', {
          tasks: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: 0,
          },
        });
      }
      const candidateAssignments = await TaskAssignment.find({ candidate: req.user.candidateId });
      const candidateTaskIds = candidateAssignments.map((a) => a.task);
      query._id = { $in: candidateTaskIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get current assignment counts for each task
    const taskIds = tasks.map((t) => t._id);
    const assignQuery = { task: { $in: taskIds } };
    if (req.user.role === 'CANDIDATE') {
      assignQuery.candidate = req.user.candidateId;
    }
    const assignments = await TaskAssignment.find(assignQuery).populate(
      'candidate',
      'name email team department'
    );

    const tasksWithAssignments = tasks.map((task) => {
      const taskAssigns = assignments.filter(
        (a) => a.task.toString() === task._id.toString()
      );
      return {
        ...task.toObject(),
        assignments: taskAssigns,
        totalAssigned: taskAssigns.length,
      };
    });

    return successResponse(res, 200, 'Tasks retrieved successfully', {
      tasks: tasksWithAssignments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task with full assignment history
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('createdBy', 'name email role');
    if (!task) {
      return errorResponse(res, 404, 'Task not found');
    }

    const assignmentQuery = { task: task._id };
    if (req.user.role === 'CANDIDATE') {
      if (!req.user.candidateId) {
        return errorResponse(res, 403, 'Forbidden: You do not have access to this task');
      }
      assignmentQuery.candidate = req.user.candidateId;
    }

    const assignments = await TaskAssignment.find(assignmentQuery)
      .populate('candidate', 'name email department designation team status')
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 });

    if (req.user.role === 'CANDIDATE' && assignments.length === 0) {
      return errorResponse(res, 403, 'Forbidden: You do not have access to this task');
    }

    return successResponse(res, 200, 'Task details retrieved', {
      task,
      assignments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task (with optional auto-assignment to a candidate)
// @route   POST /api/tasks
// @access  Private (Admin, Reviewer)
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, candidateId, candidateIds, deadline, notes } = req.body;

    if (!title || !description) {
      return errorResponse(res, 400, 'Title and description are required');
    }

    const task = await Task.create({
      title,
      description,
      priority: priority || 'MEDIUM',
      createdBy: req.user._id,
    });

    // Bulk assignment - "Assign to All Employees" or a multi-select of candidates
    if (Array.isArray(candidateIds) && candidateIds.length > 0 && deadline) {
      const uniqueCandidateIds = [...new Set(candidateIds.map((id) => id.toString()))];
      const createdAssignments = await Promise.all(
        uniqueCandidateIds.map((id) =>
          TaskAssignment.create({
            task: task._id,
            candidate: id,
            assignedBy: req.user._id,
            deadline: new Date(deadline),
            notes: notes || '',
            status: 'PENDING',
            progressPercentage: 0,
          })
        )
      );

      const populatedAssignments = await TaskAssignment.find({
        _id: { $in: createdAssignments.map((a) => a._id) },
      })
        .populate('candidate', 'name email team department designation')
        .populate('task');

      const assignments = populatedAssignments.map((populated) => ({
        ...populated.toObject(),
        ...calculateDeadlineStatus(populated),
      }));

      Promise.all(
        populatedAssignments.map((assignment) =>
          notifyProjectAssigned({ assignment, task, assignedBy: req.user })
        )
      ).catch((error) => console.error('[Notification] Assignment delivery failed:', error.message));

      return successResponse(res, 201, 'Task created and allocated to all selected employees', {
        task,
        assignments,
        totalAssigned: assignments.length,
      });
    }

    // Single-candidate assignment (existing behavior)
    let assignment = null;
    if (candidateId && deadline) {
      assignment = await TaskAssignment.create({
        task: task._id,
        candidate: candidateId,
        assignedBy: req.user._id,
        deadline: new Date(deadline),
        notes: notes || '',
        status: 'PENDING',
        progressPercentage: 0,
      });

      const populated = await TaskAssignment.findById(assignment._id)
        .populate('candidate', 'name email team department designation')
        .populate('task');

      const deadlineInfo = calculateDeadlineStatus(populated);
      assignment = {
        ...populated.toObject(),
        ...deadlineInfo,
      };

      notifyProjectAssigned({ assignment: populated, task, assignedBy: req.user })
        .catch((error) => console.error('[Notification] Assignment delivery failed:', error.message));
    }

    return successResponse(res, 201, 'Task created successfully', {
      task,
      assignment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private (Admin, Reviewer)
const updateTask = async (req, res, next) => {
  try {
    const { title, description, priority } = req.body;

    let task = await Task.findById(req.params.id);
    if (!task) {
      return errorResponse(res, 404, 'Task not found');
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.priority = priority || task.priority;

    await task.save();

    return successResponse(res, 200, 'Task updated successfully', { task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin)
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return errorResponse(res, 404, 'Task not found');
    }

    await TaskAssignment.deleteMany({ task: task._id });
    await Task.findByIdAndDelete(req.params.id);

    return successResponse(res, 200, 'Task and its assignments deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};

