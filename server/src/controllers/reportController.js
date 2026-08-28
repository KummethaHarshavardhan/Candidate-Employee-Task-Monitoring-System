const Candidate = require('../models/Candidate');
const Task = require('../models/Task');
const TaskAssignment = require('../models/TaskAssignment');
const Submission = require('../models/Submission');
const Review = require('../models/Review');
const { calculateDeadlineStatus } = require('../utils/calculateDeadlineStatus');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// @desc    Get complete high-level system metrics & report overview
// @route   GET /api/reports/overview
// @access  Private
const getOverviewReport = async (req, res, next) => {
  try {
    const isCandidate = req.user.role === 'CANDIDATE';
    const candidateId = req.user.candidateId;

    let totalCandidates = 0;
    let totalTasks = 0;
    let assignments = [];
    let pendingReviewsCount = 0;

    if (isCandidate) {
      if (candidateId) {
        totalCandidates = 1;
        assignments = await TaskAssignment.find({ candidate: candidateId })
          .populate('task')
          .populate('candidate');
        totalTasks = assignments.length;
        pendingReviewsCount = await Submission.countDocuments({
          candidate: candidateId,
          status: 'SUBMITTED',
        });
      }
    } else {
      totalCandidates = await Candidate.countDocuments({ status: 'ACTIVE' });
      totalTasks = await Task.countDocuments();
      assignments = await TaskAssignment.find()
        .populate('task')
        .populate('candidate');
      pendingReviewsCount = await Submission.countDocuments({ status: 'SUBMITTED' });
    }

    const totalAssignments = assignments.length;
    let completed = 0;
    let pending = 0;
    let inProgress = 0;
    let submitted = 0;
    let rework = 0;
    let overdue = 0;

    let upcoming = 0;
    let dueToday = 0;
    let completedOnTime = 0;
    let completedLate = 0;

    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    const statusCounts = {
      PENDING: 0,
      IN_PROGRESS: 0,
      SUBMITTED: 0,
      COMPLETED: 0,
      REWORK_REQUIRED: 0,
    };

    assignments.forEach((a) => {
      if (statusCounts[a.status] !== undefined) {
        statusCounts[a.status]++;
      }

      if (a.task && a.task.priority && priorityCounts[a.task.priority] !== undefined) {
        priorityCounts[a.task.priority]++;
      }

      const { isOverdue, deadlineCategory } = calculateDeadlineStatus(a);
      if (isOverdue) overdue++;

      switch (a.status) {
        case 'COMPLETED':
          completed++;
          break;
        case 'PENDING':
          pending++;
          break;
        case 'IN_PROGRESS':
          inProgress++;
          break;
        case 'SUBMITTED':
          submitted++;
          break;
        case 'REWORK_REQUIRED':
          rework++;
          break;
      }

      switch (deadlineCategory) {
        case 'UPCOMING':
          upcoming++;
          break;
        case 'DUE_TODAY':
          dueToday++;
          break;
        case 'COMPLETED_ON_TIME':
          completedOnTime++;
          break;
        case 'COMPLETED_LATE':
          completedLate++;
          break;
      }
    });

    const completionRate = totalAssignments > 0 ? Math.round((completed / totalAssignments) * 100) : 0;
    const onTimeRate = completed > 0 ? Math.round((completedOnTime / completed) * 100) : 0;

    return successResponse(res, 200, 'Overview report fetched successfully', {
      kpi: {
        totalCandidates,
        totalTasks,
        totalAssignments,
        completedTasks: completed,
        pendingTasks: pending,
        inProgressTasks: inProgress,
        submittedTasks: submitted,
        reworkTasks: rework,
        overdueTasks: overdue,
        awaitingReviewTasks: pendingReviewsCount,
        completionRate,
        onTimeRate,
      },
      statusDistribution: [
        { name: 'Completed', value: completed, color: '#10b981' },
        { name: 'In Progress', value: inProgress, color: '#3b82f6' },
        { name: 'Submitted', value: submitted, color: '#8b5cf6' },
        { name: 'Pending', value: pending, color: '#64748b' },
        { name: 'Rework Required', value: rework, color: '#f59e0b' },
      ],
      priorityDistribution: [
        { name: 'Low', count: priorityCounts.LOW, color: '#10b981' },
        { name: 'Medium', count: priorityCounts.MEDIUM, color: '#3b82f6' },
        { name: 'High', count: priorityCounts.HIGH, color: '#f59e0b' },
        { name: 'Urgent', count: priorityCounts.URGENT, color: '#ef4444' },
      ],
      deadlineStats: {
        upcoming,
        dueToday,
        overdue,
        completedOnTime,
        completedLate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get candidate-wise performance metrics
// @route   GET /api/reports/candidates
// @access  Private
const getCandidatePerformanceReport = async (req, res, next) => {
  try {
    const isCandidate = req.user.role === 'CANDIDATE';
    const candidateId = req.user.candidateId;

    if (isCandidate && !candidateId) {
      return successResponse(res, 200, 'Candidate performance report fetched', { report: [] });
    }

    const { team, search } = req.query;

    const query = { status: 'ACTIVE' };
    if (isCandidate) {
      query._id = candidateId;
    } else {
      if (team) query.team = team;
      if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [{ name: regex }, { email: regex }, { department: regex }, { designation: regex }];
      }
    }

    const candidates = await Candidate.find(query).sort({ name: 1 });
    const candidateIds = candidates.map((c) => c._id);

    const assignments = await TaskAssignment.find({ candidate: { $in: candidateIds } }).populate('task');
    const reviews = await Review.find().populate('submission');

    const report = candidates.map((c) => {
      const candAssigns = assignments.filter(
        (a) => a.candidate.toString() === c._id.toString()
      );

      const totalAssigned = candAssigns.length;
      let completed = 0;
      let pending = 0;
      let inProgress = 0;
      let submitted = 0;
      let rework = 0;
      let overdue = 0;
      let completedOnTime = 0;

      candAssigns.forEach((a) => {
        const { isOverdue, deadlineCategory } = calculateDeadlineStatus(a);
        if (isOverdue) overdue++;

        if (a.status === 'COMPLETED') {
          completed++;
          if (deadlineCategory === 'COMPLETED_ON_TIME') completedOnTime++;
        } else if (a.status === 'PENDING') pending++;
        else if (a.status === 'IN_PROGRESS') inProgress++;
        else if (a.status === 'SUBMITTED') submitted++;
        else if (a.status === 'REWORK_REQUIRED') rework++;
      });

      // Count reworks triggered for this candidate across all assignments
      const candidateAssignmentIds = candAssigns.map((a) => a._id.toString());
      const candidateReworkCount = reviews.filter(
        (r) =>
          candidateAssignmentIds.includes(r.taskAssignment?.toString()) &&
          r.decision === 'REWORK_REQUIRED'
      ).length;

      const completionPercentage =
        totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;
      const onTimePercentage =
        completed > 0 ? Math.round((completedOnTime / completed) * 100) : 0;

      return {
        _id: c._id,
        name: c.name,
        email: c.email,
        department: c.department,
        designation: c.designation,
        team: c.team,
        totalAssigned,
        completed,
        pending,
        inProgress,
        submitted,
        reworkCurrent: rework,
        overdue,
        completionPercentage,
        onTimePercentage,
        reworkCount: candidateReworkCount,
      };
    });

    return successResponse(res, 200, 'Candidate performance report fetched', { report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get team-wise performance metrics
// @route   GET /api/reports/teams
// @access  Private
const getTeamPerformanceReport = async (req, res, next) => {
  try {
    const isCandidate = req.user.role === 'CANDIDATE';
    const candidateId = req.user.candidateId;

    if (isCandidate && !candidateId) {
      return successResponse(res, 200, 'Team performance report fetched', { report: [] });
    }

    let candidateQuery = {};
    let assignmentQuery = {};

    if (isCandidate) {
      candidateQuery = { _id: candidateId };
      assignmentQuery = { candidate: candidateId };
    }

    const candidates = await Candidate.find(candidateQuery);
    const assignments = await TaskAssignment.find(assignmentQuery).populate('candidate').populate('task');
    const reviews = await Review.find();

    const teamData = {};

    candidates.forEach((c) => {
      const team = c.team || 'General';
      if (!teamData[team]) {
        teamData[team] = {
          team,
          totalCandidates: 0,
          totalTasks: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          submitted: 0,
          rework: 0,
          overdue: 0,
          completedOnTime: 0,
          reworkEventsCount: 0,
        };
      }
      teamData[team].totalCandidates++;
    });

    assignments.forEach((a) => {
      if (!a.candidate) return;
      const team = a.candidate.team || 'General';
      if (!teamData[team]) {
        teamData[team] = {
          team,
          totalCandidates: 0,
          totalTasks: 0,
          completed: 0,
          pending: 0,
          inProgress: 0,
          submitted: 0,
          rework: 0,
          overdue: 0,
          completedOnTime: 0,
          reworkEventsCount: 0,
        };
      }

      teamData[team].totalTasks++;

      const { isOverdue, deadlineCategory } = calculateDeadlineStatus(a);
      if (isOverdue) teamData[team].overdue++;

      if (a.status === 'COMPLETED') {
        teamData[team].completed++;
        if (deadlineCategory === 'COMPLETED_ON_TIME') {
          teamData[team].completedOnTime++;
        }
      } else if (a.status === 'PENDING') teamData[team].pending++;
      else if (a.status === 'IN_PROGRESS') teamData[team].inProgress++;
      else if (a.status === 'SUBMITTED') teamData[team].submitted++;
      else if (a.status === 'REWORK_REQUIRED') teamData[team].rework++;
    });

    const report = Object.values(teamData).map((t) => {
      const averageCompletionPercentage =
        t.totalTasks > 0 ? Math.round((t.completed / t.totalTasks) * 100) : 0;
      const onTimePercentage =
        t.completed > 0 ? Math.round((t.completedOnTime / t.completed) * 100) : 0;

      return {
        ...t,
        averageCompletionPercentage,
        onTimePercentage,
      };
    });

    return successResponse(res, 200, 'Team performance report fetched', { report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task-wise detailed report with complete tracking columns
// @route   GET /api/reports/tasks
// @access  Private
const getTaskWiseReport = async (req, res, next) => {
  try {
    const isCandidate = req.user.role === 'CANDIDATE';
    const userCandidateId = req.user.candidateId;

    if (isCandidate && !userCandidateId) {
      return successResponse(res, 200, 'Task reports fetched successfully', { report: [] });
    }

    const { candidateId, team, status, priority, isOverdue, search } = req.query;

    const query = {};
    if (isCandidate) {
      query.candidate = userCandidateId;
    } else if (candidateId) {
      query.candidate = candidateId;
    }

    if (status) query.status = status;

    let assignments = await TaskAssignment.find(query)
      .populate('task')
      .populate('candidate')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({ taskAssignment: { $in: assignmentIds } });
    const reviews = await Review.find({ taskAssignment: { $in: assignmentIds } }).sort({
      reviewedAt: -1,
    });

    let report = assignments.map((a) => {
      const deadlineInfo = calculateDeadlineStatus(a);
      const assignSubmissions = submissions.filter(
        (s) => s.taskAssignment.toString() === a._id.toString()
      );
      const assignReviews = reviews.filter(
        (r) => r.taskAssignment.toString() === a._id.toString()
      );

      const latestReview = assignReviews.length > 0 ? assignReviews[0] : null;

      return {
        assignmentId: a._id,
        taskTitle: a.task?.title || 'N/A',
        taskDescription: a.task?.description || '',
        priority: a.task?.priority || 'MEDIUM',
        candidateName: a.candidate?.name || 'Unassigned',
        candidateEmail: a.candidate?.email || '',
        candidateTeam: a.candidate?.team || 'General',
        candidateDepartment: a.candidate?.department || '',
        status: a.status,
        progressPercentage: a.progressPercentage || 0,
        assignedAt: a.assignedAt,
        deadline: a.deadline,
        completedAt: a.completedAt,
        isOverdue: deadlineInfo.isOverdue,
        deadlineCategory: deadlineInfo.deadlineCategory,
        submissionCount: assignSubmissions.length,
        latestSubmissionDate: assignSubmissions.length > 0 ? assignSubmissions[assignSubmissions.length - 1].submittedAt : null,
        latestReviewDecision: latestReview ? latestReview.decision : 'NONE',
        latestReviewComments: latestReview ? latestReview.comments : '',
      };
    });

    if (team) {
      report = report.filter(
        (r) => r.candidateTeam.toLowerCase() === team.toLowerCase()
      );
    }

    if (priority) {
      report = report.filter(
        (r) => r.priority.toUpperCase() === priority.toUpperCase()
      );
    }

    if (isOverdue !== undefined && isOverdue !== '') {
      const checkOverdue = isOverdue === 'true' || isOverdue === true;
      report = report.filter((r) => r.isOverdue === checkOverdue);
    }

    if (search) {
      const s = search.toLowerCase();
      report = report.filter(
        (r) =>
          r.taskTitle.toLowerCase().includes(s) ||
          r.candidateName.toLowerCase().includes(s) ||
          r.candidateTeam.toLowerCase().includes(s)
      );
    }

    return successResponse(res, 200, 'Task-wise report retrieved', {
      report,
      count: report.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewReport,
  getCandidatePerformanceReport,
  getTeamPerformanceReport,
  getTaskWiseReport,
};