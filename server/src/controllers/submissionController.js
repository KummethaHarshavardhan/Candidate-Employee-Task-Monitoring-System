const Submission = require('../models/Submission');
const TaskAssignment = require('../models/TaskAssignment');
const Review = require('../models/Review');
const { calculateDeadlineStatus } = require('../utils/calculateDeadlineStatus');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { notifyProjectSubmitted } = require('../utils/notificationService');

// @desc    Get all submissions with filtering
// @route   GET /api/submissions
// @access  Private
const getSubmissions = async (req, res, next) => {
  try {
    const { candidateId, assignmentId, status, page = 1, limit = 50 } = req.query;

    const query = {};

    if (req.user.role === 'CANDIDATE') {
      if (!req.user.candidateId) {
        return successResponse(res, 200, 'Submissions retrieved successfully', {
          submissions: [],
          pagination: { total: 0, page: 1, limit: parseInt(limit), pages: 1 },
        });
      }
      query.candidate = req.user.candidateId;
    } else if (candidateId) {
      query.candidate = candidateId;
    }

    if (assignmentId) {
      query.taskAssignment = assignmentId;
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Submission.countDocuments(query);

    const submissions = await Submission.find(query)
      .populate('candidate', 'name email team department')
      .populate({
        path: 'taskAssignment',
        populate: [{ path: 'task' }, { path: 'assignedBy', select: 'name email' }],
      })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Fetch review feedback for each submission
    const submissionIds = submissions.map((s) => s._id);
    const reviews = await Review.find({ submission: { $in: submissionIds } })
      .populate('reviewer', 'name email role')
      .sort({ reviewedAt: -1 });

    const submissionsWithReviews = submissions.map((sub) => {
      const subReviews = reviews.filter(
        (r) => r.submission.toString() === sub._id.toString()
      );
      const assignmentDeadline = sub.taskAssignment
        ? calculateDeadlineStatus(sub.taskAssignment)
        : null;

      return {
        ...sub.toObject(),
        reviews: subReviews,
        deadlineInfo: assignmentDeadline,
      };
    });

    return successResponse(res, 200, 'Submissions retrieved successfully', {
      submissions: submissionsWithReviews,
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

// @desc    Get submission by ID with complete details and review history
// @route   GET /api/submissions/:id
// @access  Private
const getSubmissionById = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('candidate', 'name email department team')
      .populate({
        path: 'taskAssignment',
        populate: [{ path: 'task' }, { path: 'assignedBy', select: 'name email role' }],
      });

    if (!submission) {
      return errorResponse(res, 404, 'Submission not found');
    }

    // Role check for candidate
    if (
      req.user.role === 'CANDIDATE' &&
      (!req.user.candidateId || submission.candidate._id.toString() !== req.user.candidateId.toString())
    ) {
      return errorResponse(res, 403, 'Forbidden: You cannot view this submission');
    }

    const reviews = await Review.find({ submission: submission._id })
      .populate('reviewer', 'name email role')
      .sort({ reviewedAt: -1 });

    const allAssignmentSubmissions = await Submission.find({
      taskAssignment: submission.taskAssignment._id,
    }).sort({ version: 1 });

    const deadlineInfo = calculateDeadlineStatus(submission.taskAssignment);

    return successResponse(res, 200, 'Submission details retrieved', {
      submission: {
        ...submission.toObject(),
        reviews,
        deadlineInfo,
        allVersions: allAssignmentSubmissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new submission for a task assignment (Submit work)
// @route   POST /api/submissions
// @access  Private (Candidate, Admin, Reviewer)
const createSubmission = async (req, res, next) => {
  try {
    const { taskAssignmentId, submissionText, attachmentUrl } = req.body;

    if (!taskAssignmentId || !submissionText) {
      return errorResponse(res, 400, 'Task assignment ID and submission text/notes are required');
    }

    const assignment = await TaskAssignment.findById(taskAssignmentId).populate('task');
    if (!assignment) {
      return errorResponse(res, 404, 'Task assignment not found');
    }

    // Check candidate permissions
    if (
      req.user.role === 'CANDIDATE' &&
      (!req.user.candidateId || assignment.candidate.toString() !== req.user.candidateId.toString())
    ) {
      return errorResponse(res, 403, 'You can only submit work for your own assigned tasks');
    }

    // Check if task is in a submittable state
    if (assignment.status === 'COMPLETED') {
      return errorResponse(res, 400, 'Task is already COMPLETED and cannot be resubmitted');
    }

    // Determine submission version: count existing submissions for this assignment + 1
    const previousSubmissionsCount = await Submission.countDocuments({
      taskAssignment: assignment._id,
    });
    const newVersion = previousSubmissionsCount + 1;

    // Create new submission record (maintaining history, never overwriting)
    const submission = await Submission.create({
      taskAssignment: assignment._id,
      candidate: assignment.candidate,
      submissionText,
      attachmentUrl: attachmentUrl || '',
      version: newVersion,
      status: 'SUBMITTED',
      submittedAt: new Date(),
    });

    // Update assignment status to SUBMITTED and progress to 100%
    assignment.status = 'SUBMITTED';
    assignment.progressPercentage = 100;
    await assignment.save();

    const populatedSubmission = await Submission.findById(submission._id)
      .populate('candidate', 'name email team department')
      .populate({
        path: 'taskAssignment',
        populate: [{ path: 'task' }],
      });

    notifyProjectSubmitted({
      submission: populatedSubmission,
      assignment,
      task: assignment.task,
      candidate: populatedSubmission.candidate,
    }).catch((error) => console.error('[Notification] Submission delivery failed:', error.message));

    return successResponse(res, 201, 'Work submitted successfully for review', {
      submission: populatedSubmission,
      assignmentStatus: assignment.status,
      version: newVersion,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSubmissions,
  getSubmissionById,
  createSubmission,
};