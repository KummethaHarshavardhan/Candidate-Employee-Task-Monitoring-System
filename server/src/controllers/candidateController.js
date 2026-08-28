const Candidate = require('../models/Candidate');
const TaskAssignment = require('../models/TaskAssignment');
const User = require('../models/User');
const { calculateDeadlineStatus } = require('../utils/calculateDeadlineStatus');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// @desc    Get all candidates with search, filter, and task summary counts
// @route   GET /api/candidates
// @access  Private (Admin, Reviewer)
const getCandidates = async (req, res, next) => {
    try {
        const { search, team, department, status, page = 1, limit = 50 } = req.query;

        const query = {};

        if (status) {
            query.status = status;
        }

        if (team) {
            query.team = team;
        }

        if (department) {
            query.department = department;
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { department: searchRegex },
                { designation: searchRegex },
                { team: searchRegex },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Candidate.countDocuments(query);
        const candidates = await Candidate.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Aggregate task assignments for each candidate to get real-time statistics
        const candidateIds = candidates.map((c) => c._id);
        const assignments = await TaskAssignment.find({ candidate: { $in: candidateIds } }).populate('task');

        const candidatesWithMetrics = candidates.map((cand) => {
            const candAssignments = assignments.filter(
                (a) => a.candidate.toString() === cand._id.toString()
            );

            let totalTasks = candAssignments.length;
            let completedTasks = 0;
            let pendingTasks = 0;
            let inProgressTasks = 0;
            let submittedTasks = 0;
            let reworkTasks = 0;
            let overdueTasks = 0;

            candAssignments.forEach((a) => {
                const { isOverdue } = calculateDeadlineStatus(a);
                if (isOverdue) overdueTasks++;

                switch (a.status) {
                    case 'COMPLETED':
                        completedTasks++;
                        break;
                    case 'PENDING':
                        pendingTasks++;
                        break;
                    case 'IN_PROGRESS':
                        inProgressTasks++;
                        break;
                    case 'SUBMITTED':
                        submittedTasks++;
                        break;
                    case 'REWORK_REQUIRED':
                        reworkTasks++;
                        break;
                    default:
                        break;
                }
            });

            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return {
                ...cand.toObject(),
                taskStats: {
                    totalTasks,
                    completedTasks,
                    pendingTasks,
                    inProgressTasks,
                    submittedTasks,
                    reworkTasks,
                    overdueTasks,
                    completionRate,
                },
            };
        });

        return successResponse(res, 200, 'Candidates fetched successfully', {
            candidates: candidatesWithMetrics,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get candidate details with all assignments, submissions, and history
// @route   GET /api/candidates/:id
// @access  Private
const getCandidateById = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id);

        if (!candidate) {
            return errorResponse(res, 404, 'Candidate not found');
        }

        if (
            req.user.role === 'CANDIDATE' &&
            (!req.user.candidateId || req.params.id !== req.user.candidateId.toString())
        ) {
            return errorResponse(res, 403, 'Forbidden: You cannot view another candidate profile');
        }

        const assignments = await TaskAssignment.find({ candidate: candidate._id })
            .populate('task')
            .populate('assignedBy', 'name email role')
            .sort({ createdAt: -1 });

        const assignmentsWithDetails = assignments.map((a) => {
            const deadlineInfo = calculateDeadlineStatus(a);
            return {
                ...a.toObject(),
                ...deadlineInfo,
            };
        });

        const totalTasks = assignmentsWithDetails.length;
        const completedTasks = assignmentsWithDetails.filter((a) => a.status === 'COMPLETED').length;
        const pendingTasks = assignmentsWithDetails.filter((a) => a.status === 'PENDING').length;
        const inProgressTasks = assignmentsWithDetails.filter((a) => a.status === 'IN_PROGRESS').length;
        const submittedTasks = assignmentsWithDetails.filter((a) => a.status === 'SUBMITTED').length;
        const reworkTasks = assignmentsWithDetails.filter((a) => a.status === 'REWORK_REQUIRED').length;
        const overdueTasks = assignmentsWithDetails.filter((a) => a.isOverdue).length;

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return successResponse(res, 200, 'Candidate details retrieved', {
            candidate,
            assignments: assignmentsWithDetails,
            summary: {
                totalTasks,
                completedTasks,
                pendingTasks,
                inProgressTasks,
                submittedTasks,
                reworkTasks,
                overdueTasks,
                completionRate,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new candidate (and optionally provision candidate user login)
// @route   POST /api/candidates
// @access  Private (Admin)
const createCandidate = async (req, res, next) => {
    try {
        const { name, email, phone, department, designation, team, joiningDate, status, password } = req.body;

        const existingCandidate = await Candidate.findOne({ email: email.toLowerCase().trim() });
        if (existingCandidate) {
            return errorResponse(res, 400, 'A candidate with this email already exists');
        }

        const candidate = await Candidate.create({
            name,
            email: email.toLowerCase().trim(),
            phone: phone || '',
            department,
            designation,
            team,
            joiningDate: joiningDate || Date.now(),
            status: status || 'ACTIVE',
        });

        // If password provided or creating login, create linked user account
        if (password && password.trim().length >= 6) {
            const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
            if (!existingUser) {
                await User.create({
                    name,
                    email: email.toLowerCase().trim(),
                    password,
                    role: 'CANDIDATE',
                    team,
                    candidateId: candidate._id,
                });
            }
        }

        return successResponse(res, 201, 'Candidate created successfully', { candidate });
    } catch (error) {
        next(error);
    }
};

// @desc    Update candidate
// @route   PUT /api/candidates/:id
// @access  Private (Admin, Reviewer)
const updateCandidate = async (req, res, next) => {
    try {
        const { name, email, phone, department, designation, team, status, joiningDate, password } = req.body;

        let candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return errorResponse(res, 404, 'Candidate not found');
        }

        if (email && email.toLowerCase().trim() !== candidate.email) {
            const emailExists = await Candidate.findOne({ email: email.toLowerCase().trim() });
            if (emailExists) {
                return errorResponse(res, 400, 'Another candidate already uses this email');
            }
        }

        candidate.name = name || candidate.name;
        candidate.email = email ? email.toLowerCase().trim() : candidate.email;
        candidate.phone = phone !== undefined ? phone : candidate.phone;
        candidate.department = department || candidate.department;
        candidate.designation = designation || candidate.designation;
        candidate.team = team || candidate.team;
        candidate.status = status || candidate.status;
        if (joiningDate) candidate.joiningDate = joiningDate;

        await candidate.save();

        // Sync User account if exists or update password if provided
        let linkedUser = await User.findOne({ candidateId: candidate._id });
        if (linkedUser) {
            linkedUser.name = candidate.name;
            linkedUser.email = candidate.email;
            linkedUser.team = candidate.team;
            if (password && password.trim().length >= 6) {
                linkedUser.password = password;
            }
            await linkedUser.save();
        } else if (password && password.trim().length >= 6) {
            await User.create({
                name: candidate.name,
                email: candidate.email,
                password,
                role: 'CANDIDATE',
                team: candidate.team,
                candidateId: candidate._id,
            });
        }

        return successResponse(res, 200, 'Candidate updated successfully', { candidate });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete candidate
// @route   DELETE /api/candidates/:id
// @access  Private (Admin)
const deleteCandidate = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return errorResponse(res, 404, 'Candidate not found');
        }

        // Delete associated assignments, linked user account, and candidate
        await TaskAssignment.deleteMany({ candidate: candidate._id });
        await User.deleteMany({ candidateId: candidate._id });
        await Candidate.findByIdAndDelete(req.params.id);

        return successResponse(res, 200, 'Candidate, user account, and related assignments deleted successfully');
    } catch (error) {
        next(error);
    }
};

// @desc    Get candidate filters metadata (teams, departments)
// @route   GET /api/candidates/meta/filters
// @access  Private
const getCandidateFiltersMeta = async (req, res, next) => {
    try {
        const teams = await Candidate.distinct('team');
        const departments = await Candidate.distinct('department');

        return successResponse(res, 200, 'Candidate filter metadata fetched', {
            teams,
            departments,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCandidates,
    getCandidateById,
    createCandidate,
    updateCandidate,
    deleteCandidate,
    getCandidateFiltersMeta,
};