const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Candidate = require('../models/Candidate');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { sendPasswordResetOtpEmail } = require('../utils/mailer');

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

// @desc    Initiate OTP password reset (Forgot Password / Resend OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, 400, 'Please provide an email address');
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    const normalizedEmail = email.toLowerCase().trim();

    if (!emailRegex.test(normalizedEmail)) {
      return errorResponse(res, 400, 'Please provide a valid email address');
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+passwordResetOtpLastSent'
    );

    // Anti-enumeration: Return generic success if account does not exist
    if (!user) {
      return successResponse(
        res,
        200,
        'If an account exists for this email address, a verification code has been sent.'
      );
    }

    // Cooldown check (60 seconds)
    const cooldownSeconds =
      parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 60;
    if (user.passwordResetOtpLastSent) {
      const secondsSinceLastSent = (Date.now() - user.passwordResetOtpLastSent.getTime()) / 1000;
      if (secondsSinceLastSent < cooldownSeconds) {
        const remainingSeconds = Math.ceil(cooldownSeconds - secondsSinceLastSent);
        return errorResponse(
          res,
          429,
          `Please wait ${remainingSeconds} second(s) before requesting a new verification code.`
        );
      }
    }

    // Generate secure 6-digit OTP (100000 to 999999)
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash the OTP with SHA-256 for secure database storage
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Expiration duration (default: 5 minutes)
    const expireMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 5;
    const expiresAt = Date.now() + expireMinutes * 60 * 1000;

    user.passwordResetOtpHash = otpHash;
    user.passwordResetOtpExpires = expiresAt;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetOtpLastSent = new Date();
    // Invalidate any previous reset authorization
    user.passwordResetAuthTokenHash = undefined;
    user.passwordResetAuthExpires = undefined;

    await user.save({ validateBeforeSave: false });

    // Send OTP email
    await sendPasswordResetOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      expireMinutes,
    });

    return successResponse(
      res,
      200,
      'If an account exists for this email address, a verification code has been sent.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Verify 6-digit OTP code for password reset
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return errorResponse(res, 400, 'Please provide both email and 6-digit verification code');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return errorResponse(res, 400, 'Verification code must be exactly 6 digits');
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+passwordResetOtpHash +passwordResetOtpExpires +passwordResetOtpAttempts'
    );

    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpires) {
      return errorResponse(res, 400, 'The verification code is invalid.');
    }

    const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5;

    // Check if max attempts reached
    if (user.passwordResetOtpAttempts >= maxAttempts) {
      // Invalidate OTP
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpires = undefined;
      user.passwordResetOtpAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return errorResponse(
        res,
        400,
        'Too many incorrect attempts. Please request a new verification code.'
      );
    }

    // Check if expired
    if (Date.now() > user.passwordResetOtpExpires.getTime()) {
      user.passwordResetOtpHash = undefined;
      user.passwordResetOtpExpires = undefined;
      user.passwordResetOtpAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return errorResponse(
        res,
        400,
        'This verification code has expired. Please request a new code.'
      );
    }

    // Hash submitted OTP and compare
    const submittedOtpHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');

    if (submittedOtpHash !== user.passwordResetOtpHash) {
      user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
      const remainingAttempts = maxAttempts - user.passwordResetOtpAttempts;

      if (remainingAttempts <= 0) {
        user.passwordResetOtpHash = undefined;
        user.passwordResetOtpExpires = undefined;
        user.passwordResetOtpAttempts = 0;
        await user.save({ validateBeforeSave: false });
        return errorResponse(
          res,
          400,
          'Too many incorrect attempts. Please request a new verification code.'
        );
      }

      await user.save({ validateBeforeSave: false });
      return errorResponse(
        res,
        400,
        `The verification code is invalid. ${remainingAttempts} attempt(s) remaining.`
      );
    }

    // OTP is valid -> Invalidate OTP & issue short-lived password reset authorization token
    const resetAuthToken = crypto.randomBytes(32).toString('hex');
    const resetAuthTokenHash = crypto
      .createHash('sha256')
      .update(resetAuthToken)
      .digest('hex');

    const authExpireMinutes =
      parseInt(process.env.PASSWORD_RESET_AUTH_EXPIRES_MINUTES, 10) || 10;
    const authExpiresAt = Date.now() + authExpireMinutes * 60 * 1000;

    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetOtpAttempts = 0;
    user.passwordResetAuthTokenHash = resetAuthTokenHash;
    user.passwordResetAuthExpires = authExpiresAt;

    await user.save({ validateBeforeSave: false });

    return successResponse(res, 200, 'OTP verified successfully.', {
      resetAuthToken,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using verified authorization token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, password, resetAuthToken } = req.body;

    if (!email) {
      return errorResponse(res, 400, 'Email address is required');
    }

    if (!resetAuthToken) {
      return errorResponse(
        res,
        400,
        'Password reset authorization token is missing. Please verify your OTP again.'
      );
    }

    if (!password) {
      return errorResponse(res, 400, 'Please provide a new password');
    }

    // Password requirements matching user model
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return errorResponse(
        res,
        400,
        'Password must contain at least 8 characters, one uppercase letter, one number, and one special character (!@#$%^&*)'
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const hashedAuthToken = crypto
      .createHash('sha256')
      .update(resetAuthToken)
      .digest('hex');

    // Find user with active, unexpired authorization token
    const user = await User.findOne({
      email: normalizedEmail,
      passwordResetAuthTokenHash: hashedAuthToken,
      passwordResetAuthExpires: { $gt: Date.now() },
    }).select('+passwordResetAuthTokenHash +passwordResetAuthExpires');

    if (!user) {
      return errorResponse(
        res,
        400,
        'Password reset authorization has expired or is invalid. Please request a new verification code.'
      );
    }

    // Update password (pre-save hook will hash it with bcrypt exactly once)
    user.password = password;

    // Clear all reset fields immediately
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpires = undefined;
    user.passwordResetOtpAttempts = undefined;
    user.passwordResetOtpLastSent = undefined;
    user.passwordResetAuthTokenHash = undefined;
    user.passwordResetAuthExpires = undefined;

    await user.save();

    return successResponse(
      res,
      200,
      'Your password has been reset successfully.'
    );
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
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
  updateMe,
  logout,
};

