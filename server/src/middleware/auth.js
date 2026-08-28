const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/responseFormatter');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return errorResponse(res, 401, 'Not authorized, no token provided');
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'super_secret_jwt_key_candidate_monitoring_system_2026'
        );

        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return errorResponse(res, 401, 'User account not found');
        }

        next();
    } catch (error) {
        return errorResponse(res, 401, 'Invalid or expired authentication token');
    }
};

module.exports = {
    protect,
};