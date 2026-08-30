const { errorResponse } = require('../utils/responseFormatter');

/**
 * Creates an in-memory sliding window rate limiter middleware.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 mins)
 * @param {number} options.max - Maximum requests allowed per window (default: 5)
 * @param {string} options.message - Custom error message
 */
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 5,
  message = 'Too many requests. Please try again later.',
} = {}) => {
  const ipRequests = new Map();

  // Periodic cleanup of expired records every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequests.entries()) {
      if (now - record.startTime > windowMs) {
        ipRequests.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.ip ||
      'unknown-ip';

    const now = Date.now();
    const record = ipRequests.get(clientIp);

    if (!record) {
      ipRequests.set(clientIp, { count: 1, startTime: now });
      return next();
    }

    if (now - record.startTime > windowMs) {
      ipRequests.set(clientIp, { count: 1, startTime: now });
      return next();
    }

    record.count += 1;

    if (record.count > max) {
      const minutesRemaining = Math.ceil((windowMs - (now - record.startTime)) / (60 * 1000));
      return errorResponse(
        res,
        429,
        message || `Too many attempts. Please try again in ${minutesRemaining} minute(s).`
      );
    }

    next();
  };
};

// Rate limiter for forgot-password: 5 requests per 15 minutes per IP
const forgotPasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests from this IP. Please wait 15 minutes before trying again.',
});

module.exports = {
  createRateLimiter,
  forgotPasswordLimiter,
};
