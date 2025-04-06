// neuroforge/backend/src/middleware/authMiddleware.js
// Purpose: Middleware to verify backend API JWT
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/mongo/User'); // Needed to attach user object to request
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

// Protect routes - verifies JWT token from Authorization header
exports.protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header (Bearer token)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Optional: Check for token in cookies if you implement that method
    // else if (req.cookies.token) {
    //   token = req.cookies.token;
    // }

    // Make sure token exists
    if (!token) {
        logger.warn('Access denied: No token provided', { url: req.originalUrl });
        return next(new ApiError('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Find user based on token payload (ID) and attach to request object
        // Exclude password if it exists in the model
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
             logger.warn(`Access denied: User not found for token ID: ${decoded.id}`, { url: req.originalUrl });
            // User associated with token no longer exists
            return next(new ApiError('User not found', 401));
        }

        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        logger.error('Token verification failed:', err.message, { token: token ? 'present' : 'missing' });
        if (err.name === 'JsonWebTokenError') {
            return next(new ApiError('Not authorized - Invalid token', 401));
        } else if (err.name === 'TokenExpiredError') {
            return next(new ApiError('Not authorized - Token expired', 401));
        }
        // Handle other potential errors during verification
        return next(new ApiError('Not authorized to access this route', 401));
    }
};

// Grant access to specific roles (example)
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
             logger.warn(`Authorization failed: User role '${req.user?.role}' not in allowed roles [${roles.join(', ')}]`, { userId: req.user?.id, url: req.originalUrl });
            return next(
                new ApiError(
                    `User role ${req.user?.role} is not authorized to access this route`,
                    403 // Forbidden
                )
            );
        }
        next();
    };
};