const express = require('express');
const router = express.Router();
const {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe,
  updateMe,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { forgotPasswordLimiter } = require('../middleware/rateLimiter');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;

