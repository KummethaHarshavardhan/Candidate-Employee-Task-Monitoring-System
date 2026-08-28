const TaskAssignment = require('../models/TaskAssignment');
const Task = require('../models/Task');
const Candidate = require('../models/Candidate');
const Submission = require('../models/Submission');
const Review = require('../models/Review');
const { calculateDeadlineStatus } = require('../utils/calculateDeadlineStatus');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { notifyProjectAssigned } = require('../utils/notificationService');

// @desc    Get all task assignments with rich filters and dynamic overdue calculation
// @route   GET /api/assignments
// @access  Private
const getAssignments = async (req, res, next) => {
  try {
    const {
      candidateId,
      taskId,
      status,
      priority,
      team,
      isOverdue,
      search,
      page = 1,
      limit = 100,
    } = req.query;

    const query = {};

    // If logged in as candidate, restrict to candidate's own assignments
    if (req.user.role === 'CANDIDATE') {
      if (!req.user.candidateId) {
        return successResponse(res, 200, 'No assignments found', {
          assignments: [],
          total: 0,
        });
      }
      query.candidate = req.user.candidateId;
    } else if (candidateId) {
      query.candidate = candidateId;
    }

    if (taskId) {
      query.task = taskId;
    }

    if (status) {
      query.status = status;
    }

    let assignments = await TaskAssignment.find(query)
      .populate('task')
      .populate('candidate')
      .populate('assignedBy', 'name email role')
      .sort({ createdAt: -1 });

    // In-memory / populated filtering for joined fields (team, priority, search, overdue)
    let filtered = assignments.map((a) => {
      const deadlineInfo = calculateDeadlineStatus(a);
      return {
        ...a.toObject(),
        ...deadlineInfo,
      };
    });

    if (priority) {
      filtered = filtered.filter(
        (a) => a.task && a.task.priority.toUpperCase() === priority.toUpperCase()
      );
    }

    if (team) {
      filtered = filtered.filter(
        (a) => a.candidate && a.candidate.team.toLowerCase() === team.toLowerCase()
      );
    }

    if (isOverdue !== undefined && isOverdue !== '') {
      const shouldBeOverdue = isOverdue === 'true' || isOverdue === true;
      filtered = filtered.filter((a) => a.isOverdue === shouldBeOverdue);
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((a) => {
        const taskTitle = a.task?.title?.toLowerCase() || '';
        const taskDesc = a.task?.description?.toLowerCase() || '';
        const candName = a.candidate?.name?.toLowerCase() || '';
        const candEmail = a.candidate?.email?.toLowerCase() || '';
        return (
          taskTitle.includes(s) ||
          taskDesc.includes(s) ||
          candName.includes(s) ||
          candEmail.includes(s)
        );
      });
    }

    const total = filtered.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = filtered.slice(skip, skip + parseInt(limit));

    return successResponse(res, 200, 'Assignments fetched successfully', {
      assignments: paginated,
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

// @desc    Get single assignment details with submissions & reviews
// @route   GET /api/assignments/:id
// @access  Private
const getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await TaskAssignment.findById(req.params.id)
      .populate('task')
      .populate('candidate')
      .populate('assignedBy', 'name email role');

    if (!assignment) {
      return errorResponse(res, 404, 'Task assignment not found');
    }

    // Role check: Candidate can only access their own assignment
    if (
      req.user.role === 'CANDIDATE' &&
      (!req.user.candidateId || assignment.candidate._id.toString() !== req.user.candidateId.toString())
    ) {
      return errorResponse(res, 403, 'Forbidden: You cannot access assignments of other candidates');
    }

    // Fetch all submissions for this assignment ordered by version ascending
    const submissions = await Submission.find({ taskAssignment: assignment._id })
      .populate('candidate', 'name email')
      .sort({ version: 1 });

    // Fetch all reviews for this assignment
    const reviews = await Review.find({ taskAssignment: assignment._id })
      .populate('reviewer', 'name email role')
      .sort({ reviewedAt: 1 });

    // Attach reviews to respective submissions
    const submissionsWithReviews = submissions.map((sub) => {
      const subReviews = reviews.filter(
        (r) => r.submission.toString() === sub._id.toString()
      );
      return {
        ...sub.toObject(),
        reviews: subReviews,
      };
    });

    const deadlineInfo = calculateDeadlineStatus(assignment);

    return successResponse(res, 200, 'Task assignment details retrieved', {
      assignment: {
        ...assignment.toObject(),
        ...deadlineInfo,
        submissions: submissionsWithReviews,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new task assignment
// @route   POST /api/assignments
// @access  Private (Admin, Reviewer)
const createAssignment = async (req, res, next) => {
  try {
    const { taskId, candidateId, deadline, notes, progressPercentage } = req.body;

    if (!taskId || !candidateId || !deadline) {
      return errorResponse(res, 400, 'Task, Candidate, and Deadline are required');
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return errorResponse(res, 404, 'Task not found');
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return errorResponse(res, 404, 'Candidate not found');
    }

    const assignment = await TaskAssignment.create({
      task: taskId,
      candidate: candidateId,
      assignedBy: req.user._id,
      deadline: new Date(deadline),
      notes: notes || '',
      status: 'PENDING',
      progressPercentage: progressPercentage || 0,
      assignmentVersion: 1,
    });

    const populated = await TaskAssignment.findById(assignment._id)
      .populate('task')
      .populate('candidate')
      .populate('assignedBy', 'name email role');

    const deadlineInfo = calculateDeadlineStatus(populated);

    notifyProjectAssigned({ assignment: populated, task: populated.task, assignedBy: req.user })
      .catch((error) => console.error('[Notification] Assignment delivery failed:', error.message));

    return successResponse(res, 201, 'Task assigned successfully', {
      assignment: {
        ...populated.toObject(),
        ...deadlineInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update assignment details (deadline, notes, etc.)
// @route   PUT /api/assignments/:id
// @access  Private (Admin, Reviewer)
const updateAssignment = async (req, res, next) => {
  try {
    const { deadline, notes, status, progressPercentage } = req.body;

    let assignment = await TaskAssignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 404, 'Assignment not found');
    }

    if (deadline) assignment.deadline = new Date(deadline);
    if (notes !== undefined) assignment.notes = notes;

    // Only allow valid status updates
    if (status && ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'REWORK_REQUIRED'].includes(status)) {
      assignment.status = status;
      if (status === 'COMPLETED' && !assignment.completedAt) {
        assignment.completedAt = new Date();
      }
    }

    if (progressPercentage !== undefined) {
      assignment.progressPercentage = Math.min(100, Math.max(0, Number(progressPercentage)));
    }

    await assignment.save();

    const populated = await TaskAssignment.findById(assignment._id)
      .populate('task')
      .populate('candidate')
      .populate('assignedBy', 'name email role');

    const deadlineInfo = calculateDeadlineStatus(populated);

    return successResponse(res, 200, 'Assignment updated successfully', {
      assignment: {
        ...populated.toObject(),
        ...deadlineInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reassign assignment to another candidate without duplicate tasks
// @route   PUT /api/assignments/:id/reassign
// @access  Private (Admin, Reviewer)
const reassignAssignment = async (req, res, next) => {
  try {
    const { newCandidateId, deadline, notes } = req.body;

    if (!newCandidateId) {
      return errorResponse(res, 400, 'New candidate ID is required for reassignment');
    }

    const candidate = await Candidate.findById(newCandidateId);
    if (!candidate) {
      return errorResponse(res, 404, 'New candidate not found');
    }

    let assignment = await TaskAssignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 404, 'Assignment not found');
    }

    assignment.candidate = newCandidateId;
    if (deadline) assignment.deadline = new Date(deadline);
    if (notes !== undefined) assignment.notes = notes;
    assignment.assignmentVersion += 1;
    assignment.status = 'PENDING';
    assignment.progressPercentage = 0;
    assignment.completedAt = null;

    await assignment.save();

    const populated = await TaskAssignment.findById(assignment._id)
      .populate('task')
      .populate('candidate')
      .populate('assignedBy', 'name email role');

    const deadlineInfo = calculateDeadlineStatus(populated);

    return successResponse(res, 200, 'Task reassigned successfully', {
      assignment: {
        ...populated.toObject(),
        ...deadlineInfo,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignments,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  reassignAssignment,
};
