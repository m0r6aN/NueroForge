// neuroforge/backend/src/controllers/authController.js
// Purpose: Handles authentication logic, specifically linking OAuth to backend JWT
const User = require('../models/mongo/User');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const config = require('../config');
const axios = require('axios'); // To verify provider tokens if needed

// @desc    Handle OAuth provider callback (e.g., called by NextAuth backend)
// @route   POST /api/v1/auth/provider-callback
// @access  Private (should only be called server-to-server or secured appropriately)
exports.handleProviderCallback = async (req, res, next) => {
    // This endpoint assumes NextAuth has already verified the OAuth user
    // and is now sending minimal user profile info to the backend to get an API token.
    const { provider, providerId, email, name, avatar } = req.body;

    // Basic validation
    if (!provider || !providerId || !email || !name) {
        return next(new ApiError('Missing required user profile fields from provider', 400));
    }

    try {
        // Find or create the user in our database based on provider info
        const user = await User.findOrCreate({ provider, providerId, email, name, avatar });

        if (!user) {
            // Should not happen if findOrCreate is implemented correctly, but good practice
            return next(new ApiError('Could not find or create user', 500));
        }

        // Update last login time (async, don't need to wait)
        User.findByIdAndUpdate(user._id, { lastLogin: Date.now() }).catch(err => logger.error('Error updating last login:', err));

        // Generate our backend API JWT
        const apiToken = user.getSignedJwtToken();

        // Optionally send back some user data along with the token
        res.status(200).json({
            success: true,
            token: apiToken,
            user: { // Send back minimal user data needed immediately by frontend
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                onboardingCompleted: user.onboardingCompleted,
                preferences: user.preferences
            }
        });

    } catch (error) {
        logger.error('Error handling provider callback:', error);
        next(new ApiError('Authentication failed', 500));
    }
};

// @desc    Get current logged in user (using API token)
// @route   GET /api/v1/auth/me
// @access  Private (Requires valid API token)
exports.getMe = async (req, res, next) => {
    // req.user is attached by the authMiddleware
    try {
        // Fetch fresh user data, excluding sensitive fields if necessary
        const user = await User.findById(req.user.id); //.select('-password');

        if (!user) {
            // This shouldn't normally happen if token is valid and user exists
            return next(new ApiError('User not found', 404));
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        logger.error('Error fetching current user:', error);
        next(new ApiError('Failed to get user data', 500));
    }
};