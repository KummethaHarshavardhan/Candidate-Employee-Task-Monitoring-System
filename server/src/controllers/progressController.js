const TaskAssignment = require('../models/TaskAssignment');
const Candidate = require('../models/Candidate');
const { calculateDeadlineStatus } = require('../utils/calculateDeadlineStatus');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// @desc    Get overall progress monitoring summary
// @route   GET /api/progress
// @access  Private
const getProgressOverview = async (req, res, next) => {
  try {
    const isCandidate = req.user.role === 'CANDIDATE';
    const candidateId = req.user.candidateId;

    if (isCandidate && !candidateId) {
      return successResponse(res, 200, 'Progress overview retrieved', {
        summary: {
          totalTasks: 0,
          pending: 0,
          inProgress: 0,
          submitted: 0,
          completed: 0,
          reworkRequired: 0,
          overdue: 0,
          averageProgress: 0,
          completionRate: 0,
        },
        deadlines: {
          upcoming: 0,
          dueToday: 0,
          overdue: 0,
          completedOnTime: 0,
          completedLate: 0,
        },
      });
    }

    const query = isCandidate ? { candidate: candidateId } : {};
    const assignments = await TaskAssignment.find(query).populate('task').populate('candidate');

    let totalTasks = assignments.length;
    let pending = 0;
    let inProgress = 0;
    let submitted = 0;
    let completed = 0;
    let reworkRequired = 0;
    let overdue = 0;

    let upcoming = 0;
    let dueToday = 0;
    let completedOnTime = 0;
    let completedLate = 0;

    let totalProgressSum = 0;

    assignments.forEach((a) => {
      totalProgressSum += a.progressPercentage || 0;

      const { isOverdue, deadlineCategory } = calculateDeadlineStatus(a);

      if (isOverdue) overdue++;

      switch (a.status) {
        case 'PENDING':
          pending++;
          break;
        case 'IN_PROGRESS':
          inProgress++;
          break;
        case 'SUBMITTED':
          submitted++;
          break;
        case 'COMPLETED':
          completed++;
          break;
        case 'REWORK_REQUIRED':
          reworkRequired++;
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

    const averageProgress = totalTasks > 0 ? Math.round(totalProgressSum / totalTasks) : 0;
    const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    return successResponse(res, 200, 'Progress overview retrieved', {
      summary: {
        totalTasks,
        pending,
        inProgress,
        submitted,
        completed,
        reworkRequired,
        overdue,
        averageProgress,
        completionRate,
      },
      deadlines: {
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

// @desc    Get progress details for all candidates
// @route   GET /api/progress/candidates
// @access  Private
const getCandidateProgress = async (req, res, next) => {
  try {
    const isCandidate = req.user.role === 'CANDIDATE';
    const candidateId = req.user.candidateId;

    if (isCandidate && !candidateId) {
      return successResponse(res, 200, 'Candidate progress retrieved', { candidates: [] });
    }

    const candQuery = isCandidate ? { _id: candidateId, status: 'ACTIVE' } : { status: 'ACTIVE' };
    const candidates = await Candidate.find(candQuery).sort({ name: 1 });
    
    const assignQuery = isCandidate ? { candidate: candidateId } : {};
    const assignments = await TaskAssignment.find(assignQuery).populate('task');

    const candidatesProgress = candidates.map((cand) => {
      const candAssigns = assignments.filter(
        (a) => a.candidate.toString() === cand._id.toString()
      );

      const totalTasks = candAssigns.length;
      let completed = 0;
      let inProgress = 0;
      let pending = 0;
      let submitted = 0;
      let rework = 0;
      let overdue = 0;
      let totalProgress = 0;

      candAssigns.forEach((a) => {
        totalProgress += a.progressPercentage || 0;
        const { isOverdue } = calculateDeadlineStatus(a);
        if (isOverdue) overdue++;

        if (a.status === 'COMPLETED') completed++;
        else if (a.status === 'IN_PROGRESS') inProgress++;
        else if (a.status === 'PENDING') pending++;
        else if (a.status === 'SUBMITTED') submitted++;
        else if (a.status === 'REWORK_REQUIRED') rework++;
      });

      const avgProgress = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;
      const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

      return {
        _id: cand._id,
        name: cand.name,
        email: cand.email,
        team: cand.team,
        department: cand.department,
        designation: cand.designation,
        totalTasks,
        completed,
        inProgress,
        pending,
        submitted,
        rework,
        overdue,
        progressPercentage: avgProgress,
        completionRate,
      };
    });

    return successResponse(res, 200, 'Candidate progress retrieved', {
      candidates: candidatesProgress,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get progress aggregated by team
// @route   GET /api/progress/teams
// @access  Private
const getTeamProgress = async (req, res, next) => {
  try {
    const isCandidate = req.user.role === 'CANDIDATE';
    const candidateId = req.user.candidateId;

    if (isCandidate && !candidateId) {
      return successResponse(res, 200, 'Team progress retrieved', { teams: [] });
    }

    const candQuery = isCandidate ? { _id: candidateId } : {};
    const assignQuery = isCandidate ? { candidate: candidateId } : {};

    const candidates = await Candidate.find(candQuery);
    const assignments = await TaskAssignment.find(assignQuery).populate('candidate');

    const teamMap = {};

    candidates.forEach((cand) => {
      const team = cand.team || 'General';
      if (!teamMap[team]) {
        teamMap[team] = {
          team,
          candidateCount: 0,
          candidateIds: [],
          totalTasks: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          submitted: 0,
          rework: 0,
          overdue: 0,
          totalProgress: 0,
        };
      }
      teamMap[team].candidateCount++;
      teamMap[team].candidateIds.push(cand._id.toString());
    });

    assignments.forEach((a) => {
      if (!a.candidate) return;
      const team = a.candidate.team || 'General';
      if (!teamMap[team]) {
        teamMap[team] = {
          team,
          candidateCount: 0,
          candidateIds: [],
          totalTasks: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          submitted: 0,
          rework: 0,
          overdue: 0,
          totalProgress: 0,
        };
      }

      teamMap[team].totalTasks++;
      teamMap[team].totalProgress += a.progressPercentage || 0;

      const { isOverdue } = calculateDeadlineStatus(a);
      if (isOverdue) teamMap[team].overdue++;

      if (a.status === 'COMPLETED') teamMap[team].completed++;
      else if (a.status === 'IN_PROGRESS') teamMap[team].inProgress++;
      else if (a.status === 'PENDING') teamMap[team].pending++;
      else if (a.status === 'SUBMITTED') teamMap[team].submitted++;
      else if (a.status === 'REWORK_REQUIRED') teamMap[team].rework++;
    });

    const teams = Object.values(teamMap).map((t) => {
      const avgProgress = t.totalTasks > 0 ? Math.round(t.totalProgress / t.totalTasks) : 0;
      const avgCompletionRate = t.totalTasks > 0 ? Math.round((t.completed / t.totalTasks) * 100) : 0;
      return {
        ...t,
        averageProgress: avgProgress,
        completionRate: avgCompletionRate,
      };
    });

    return successResponse(res, 200, 'Team progress retrieved', { teams });
  } catch (error) {
    next(error);
  }
};

// @desc    Update progress for a specific task assignment
// @route   PUT /api/progress/:assignmentId
// @access  Private
const updateTaskProgress = async (req, res, next) => {
  try {
    const { progressPercentage, status, notes } = req.body;

    const assignment = await TaskAssignment.findById(req.params.assignmentId).populate('task');

    if (!assignment) {
      return errorResponse(res, 404, 'Task assignment not found');
    }

    // Role check: Candidates can only update their own assignment
    if (
      req.user.role === 'CANDIDATE' &&
      req.user.candidateId &&
      assignment.candidate.toString() !== req.user.candidateId.toString()
    ) {
      return errorResponse(res, 403, 'Forbidden: You can only update your own assigned tasks');
    }

    // Prevent direct jumping to COMPLETED via progress update
    if (status === 'COMPLETED' && req.user.role === 'CANDIDATE') {
      return errorResponse(
        res,
        400,
        'Cannot directly mark task as COMPLETED. Please submit your work for review.'
      );
    }

    if (progressPercentage !== undefined) {
      const prog = Math.min(100, Math.max(0, parseInt(progressPercentage, 10)));
      assignment.progressPercentage = prog;

      // Auto-transition to IN_PROGRESS if status was PENDING or REWORK_REQUIRED and progress started
      if ((assignment.status === 'PENDING' || assignment.status === 'REWORK_REQUIRED') && prog > 0) {
        assignment.status = 'IN_PROGRESS';
      }
    }

    if (status && ['PENDING', 'IN_PROGRESS', 'REWORK_REQUIRED'].includes(status)) {
      assignment.status = status;
    }

    if (notes !== undefined) {
      assignment.notes = notes;
    }

    await assignment.save();

    const populated = await TaskAssignment.findById(assignment._id)
      .populate('task')
      .populate('candidate')
      .populate('assignedBy', 'name email role');

    const deadlineInfo = calculateDeadlineStatus(populated);

    return successResponse(res, 200, 'Progress updated successfully', {
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
  getProgressOverview,
  getCandidateProgress,
  getTeamProgress,
  updateTaskProgress,
};