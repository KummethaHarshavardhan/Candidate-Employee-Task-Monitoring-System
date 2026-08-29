const User = require('../models/User');
const Candidate = require('../models/Candidate');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Admin)
const getUsers = async (req, res, next) => {
  try {
    const { role, team, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (team) query.team = team;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { email: regex }, { team: regex }];
    }

    const users = await User.find(query)
      .populate('candidateId', 'department designation status')
      .select('-password')
      .sort({ createdAt: -1 });

    return successResponse(res, 200, 'Users retrieved successfully', { users });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a system user (Reviewer or Admin)
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, team } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Name, email, and password are required');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return errorResponse(res, 400, 'A user with this email address already exists');
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'REVIEWER',
      team: team || (role === 'ADMIN' ? 'Management' : 'Technical Review'),
    });

    const userObj = user.toObject();
    delete userObj.password;

    return successResponse(res, 201, 'User account created successfully', { user: userObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Update system user
// @route   PUT /api/users/:id
// @access  Private (Admin)
const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, team, password } = req.body;

    let user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return errorResponse(res, 400, 'Another user already uses this email address');
      }
      user.email = email.toLowerCase().trim();
    }

    if (name) user.name = name;
    if (role && ['ADMIN', 'REVIEWER', 'CANDIDATE'].includes(role)) user.role = role;
    if (team) user.team = team;
    if (password && password.trim().length >= 6) {
      user.password = password; // pre-save hook will hash it
    }

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    return successResponse(res, 200, 'User updated successfully', { user: userObj });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Prevent admin from deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return errorResponse(res, 400, 'Cannot delete your own active administrator account');
    }

    await User.findByIdAndDelete(req.params.id);

    return successResponse(res, 200, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
