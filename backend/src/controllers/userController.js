// neuroforge/backend/src/controllers/userController.js
// Purpose: Handles business logic for user profile management
const User = require('../models/mongo/User');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

// @desc    Get logged-in user's profile (could be same as getMe or more specific)
// @route   GET /api/v1/users/profile
// @access  Private
exports.getMyProfile = async (req, res, next) => {
    // req.user is already available from 'protect' middleware
    res.status(200).json({
        success: true,
        data: req.user
    });
};

// @desc    Update logged-in user's profile details
// @route   PUT /api/v1/users/profile
// @access  Private
exports.updateMyProfile = async (req, res, next) => {
    // Fields allowed to be updated by the user themselves
    const { name, preferences, avatar } = req.body;
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name;
    if (avatar) fieldsToUpdate.avatar = avatar;

    // --- UPDATED PREFERENCES HANDLING ---
    if (preferences) {
        // Get existing preferences to merge non-provided fields
        const existingPrefs = req.user.preferences || {};
        const newPrefs = { ...existingPrefs }; // Start with existing

        // Merge top-level preferences like theme, learningMode
        if (preferences.theme !== undefined) newPrefs.theme = preferences.theme;
        if (preferences.learningMode !== undefined) newPrefs.learningMode = preferences.learningMode;

        // Merge audio preferences carefully
        if (preferences.audio !== undefined) {
            newPrefs.audio = { ...(existingPrefs.audio || {}), ...preferences.audio };
            // Ensure types/constraints if needed (e.g., clamp volume)
            if (newPrefs.audio.defaultVolume !== undefined) {
                newPrefs.audio.defaultVolume = Math.max(0, Math.min(1, newPrefs.audio.defaultVolume));
            }
        }

        fieldsToUpdate.preferences = newPrefs;
    }

    // Add other updatable fields here (e.g., learning style quiz results)

    try {
        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true,
        }).select('+preferences'); // Explicitly select preferences if needed

        if (!user) {
            return next(new ApiError('User not found', 404));
        }

        logger.info(`User profile updated: ${user.email} (ID: ${user._id})`, { updatedFields: Object.keys(fieldsToUpdate) });
        res.status(200).json({
            success: true,
            data: user, // Send back the updated user data including preferences
        });
    } catch (error) {
        // ... existing error handling ...
        logger.error(`Error updating profile for user ${req.user.id}:`, error);
        if (error.name === 'ValidationError') {
            return next(new ApiError(error.message, 400));
        }
        next(new ApiError('Server error while updating profile', 500));
    }
};

// --- Placeholder Admin functions ---
// exports.getAllUsers = async (req, res, next) => { ... };
// exports.getUserById = async (req, res, next) => { ... };
// exports.updateUser = async (req, res, next) => { ... }; // Admin updating other users
// exports.deleteUser = async (req, res, next) => { ... };