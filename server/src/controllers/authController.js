const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_candidate_monitoring_system_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new Candidate/Employee account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, department, designation, team } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Please provide name, email, and password');
    }

    if (password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check duplicate in User collection
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return errorResponse(res, 400, 'An account with this email already exists');
    }

    // Check or find existing candidate
    let candidate = await Candidate.findOne({ email: normalizedEmail });
    if (!candidate) {
      candidate = await Candidate.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : '',
        department: department ? department.trim() : 'General Engineering',
        designation: designation ? designation.trim() : 'Candidate / Trainee',
        team: team ? team.trim() : 'General',
        status: 'ACTIVE',
      });
    }

    // Public registration is strictly restricted to CANDIDATE role
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : '',
      role: 'CANDIDATE', // strictly forced to CANDIDATE
      team: candidate.team || 'General',
      candidateId: candidate._id,
    });

    const token = generateToken(user._id);

    return successResponse(res, 201, 'Registration successful', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        team: user.team,
        candidateId: user.candidateId,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide an email and password');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    const token = generateToken(user._id);

    return successResponse(res, 200, 'Login successful', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        team: user.team,
        candidateId: user.candidateId,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('candidateId');
    return successResponse(res, 200, 'User profile fetched', { user });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, 404, 'User not found');

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    await user.save();

    if (user.candidateId && phone !== undefined) {
      await Candidate.findByIdAndUpdate(user.candidateId, { phone: user.phone });
    }

    const updatedUser = await User.findById(user._id).populate('candidateId');
    return successResponse(res, 200, 'Profile updated successfully', { user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out / clear cookie/session
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  return successResponse(res, 200, 'Logged out successfully');
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  logout,
};
