const Review = require('../models/Review');
const Submission = require('../models/Submission');
const TaskAssignment = require('../models/TaskAssignment');
const { calculateDeadlineStatus } = require('../utils/calculateDeadlineStatus');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// @desc    Get review queue (submissions awaiting review)
// @route   GET /api/reviews/pending
// @access  Private (Admin, Reviewer)
const getReviewQueue = async (req, res, next) => {
  try {
    const { team, priority, search } = req.query;

    let submissions = await Submission.find({ status: 'SUBMITTED' })
      .populate('candidate')
      .populate({
        path: 'taskAssignment',
        populate: [{ path: 'task' }, { path: 'assignedBy', select: 'name email role' }],
      })
      .sort({ submittedAt: -1 });

    let queue = submissions.map((sub) => {
      const deadlineInfo = sub.taskAssignment
        ? calculateDeadlineStatus(sub.taskAssignment)
        : null;
      return {
        ...sub.toObject(),
        deadlineInfo,
      };
    });

    if (team) {
      queue = queue.filter(
        (item) => item.candidate && item.candidate.team?.toLowerCase() === team.toLowerCase()
      );
    }

    if (priority) {
      queue = queue.filter(
        (item) =>
          item.taskAssignment?.task &&
          item.taskAssignment.task.priority?.toUpperCase() === priority.toUpperCase()
      );
    }

    if (search) {
      const s = search.toLowerCase();
      queue = queue.filter((item) => {
        const title = item.taskAssignment?.task?.title?.toLowerCase() || '';
        const name = item.candidate?.name?.toLowerCase() || '';
        const email = item.candidate?.email?.toLowerCase() || '';
        return title.includes(s) || name.includes(s) || email.includes(s);
      });
    }

    return successResponse(res, 200, 'Review queue retrieved', {
      queue,
      count: queue.length,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single review by ID
// @route   GET /api/reviews/:id
// @access  Private
const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewer', 'name email role')
      .populate({
        path: 'submission',
        populate: [{ path: 'candidate' }],
      })
      .populate({
        path: 'taskAssignment',
        populate: [{ path: 'task' }],
      });

    if (!review) {
      return errorResponse(res, 404, 'Review not found');
    }

    if (
      req.user.role === 'CANDIDATE' &&
      (!req.user.candidateId || review.submission?.candidate?._id?.toString() !== req.user.candidateId.toString())
    ) {
      return errorResponse(res, 403, 'Forbidden: You cannot view another candidate review feedback');
    }

    return successResponse(res, 200, 'Review retrieved successfully', { review });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a submission -> Task becomes COMPLETED
// @route   POST /api/reviews/:submissionId/approve
// @access  Private (Admin, Reviewer)
const approveSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { comments } = req.body;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return errorResponse(res, 404, 'Submission not found');
    }

    const assignment = await TaskAssignment.findById(submission.taskAssignment);
    if (!assignment) {
      return errorResponse(res, 404, 'Task assignment not found');
    }

    // Create Review record
    const review = await Review.create({
      submission: submission._id,
      taskAssignment: assignment._id,
      reviewer: req.user._id,
      comments: comments || 'Submission approved. Task completed successfully.',
      decision: 'APPROVED',
      reviewedAt: new Date(),
    });

    // Update Submission status
    submission.status = 'APPROVED';
    await submission.save();

    // Update TaskAssignment to COMPLETED
    assignment.status = 'COMPLETED';
    assignment.completedAt = new Date();
    assignment.progressPercentage = 100;
    await assignment.save();

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name email role')
      .populate('submission')
      .populate({
        path: 'taskAssignment',
        populate: [{ path: 'task' }, { path: 'candidate' }],
      });

    return successResponse(res, 200, 'Submission approved and task marked as COMPLETED', {
      review: populatedReview,
      assignmentStatus: 'COMPLETED',
      submissionStatus: 'APPROVED',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request rework on a submission -> Task becomes REWORK_REQUIRED
// @route   POST /api/reviews/:submissionId/rework
// @access  Private (Admin, Reviewer)
const reworkSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { comments } = req.body;

    if (!comments || !comments.trim()) {
      return errorResponse(res, 400, 'Review feedback comments are required when requesting rework');
    }

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return errorResponse(res, 404, 'Submission not found');
    }

    const assignment = await TaskAssignment.findById(submission.taskAssignment);
    if (!assignment) {
      return errorResponse(res, 404, 'Task assignment not found');
    }

    // Create Review record with rework decision
    const review = await Review.create({
      submission: submission._id,
      taskAssignment: assignment._id,
      reviewer: req.user._id,
      comments: comments.trim(),
      decision: 'REWORK_REQUIRED',
      reviewedAt: new Date(),
    });

    // Update Submission status
    submission.status = 'REWORK_REQUIRED';
    await submission.save();

    // Update TaskAssignment to REWORK_REQUIRED
    assignment.status = 'REWORK_REQUIRED';
    await assignment.save();

    const populatedReview = await Review.findById(review._id)
      .populate('reviewer', 'name email role')
      .populate('submission')
      .populate({
        path: 'taskAssignment',
        populate: [{ path: 'task' }, { path: 'candidate' }],
      });

    return successResponse(res, 200, 'Rework requested successfully', {
      review: populatedReview,
      assignmentStatus: 'REWORK_REQUIRED',
      submissionStatus: 'REWORK_REQUIRED',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for an assignment
// @route   GET /api/reviews/assignment/:assignmentId
// @access  Private
const getAssignmentReviews = async (req, res, next) => {
  try {
    if (req.user.role === 'CANDIDATE') {
      const assignment = await TaskAssignment.findById(req.params.assignmentId);
      if (!assignment || !req.user.candidateId || assignment.candidate.toString() !== req.user.candidateId.toString()) {
        return errorResponse(res, 403, 'Forbidden: You cannot access reviews of another candidate');
      }
    }

    const reviews = await Review.find({ taskAssignment: req.params.assignmentId })
      .populate('reviewer', 'name email role')
      .populate('submission')
      .sort({ reviewedAt: -1 });

    return successResponse(res, 200, 'Assignment review history retrieved', { reviews });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviewQueue,
  getReviewById,
  approveSubmission,
  reworkSubmission,
  getAssignmentReviews,
};