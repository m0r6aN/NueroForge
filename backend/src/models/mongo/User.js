// neuroforge/backend/src/models/mongo/User.js
// Purpose: Mongoose schema for Users
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    // Basic info from OAuth or local signup (if implemented later)
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [ // Basic email validation regex
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
        lowercase: true,
    },
    // For potential future password login (hashed password)
    password: {
        type: String,
        required: false, // Not required for OAuth-only users initially
        minlength: 6,
        select: false, // Don't return password by default
    },
    // OAuth provider details
    authProvider: {
        type: String, // e.g., 'google', 'github'
        required: true,
    },
    providerId: { // The unique ID from the OAuth provider
        type: String,
        required: true,
    },
    avatar: { // URL to profile picture
        type: String,
        required: false,
    },
    // NeuroForge specific fields
    role: {
        type: String,
        enum: ['user', 'admin', 'creator'], // Example roles
        default: 'user',
    },
    preferences: {
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        learningMode: { type: String, enum: ['junior_cadet', 'elite_operative'], default: 'elite_operative' },
        // --- START NEW AUDIO PREFERENCES ---
        audio: {
            enabled: { type: Boolean, default: false }, // Is the system globally enabled by user?
            defaultVolume: { type: Number, min: 0, max: 1, default: 0.5 },
            defaultPreset: { // Store the name/key of the preferred preset
                type: String,
                enum: ['focus', 'creative', 'deep_learning', 'relaxation', 'custom', null], // Add more presets as needed
                default: null
            },
            // Store custom settings if 'custom' preset is selected
            customFrequency: { type: Number, min: 1, max: 50, required: false }, // Base frequency for tones
            customBeatFrequency: { type: Number, min: 0.5, max: 30, required: false }, // Difference for binaural beats
            customToneType: { type: String, enum: ['binaural', 'isochronic'], required: false }
        }
        // --- END NEW AUDIO PREFERENCES ---
    },
    onboardingCompleted: {
        type: Boolean,
        default: false,
    },
    // Gamification Data
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    // Refined streak tracking
    streaks: {
        daily: {
            count: { type: Number, default: 0 },
            lastCompletedDate: { type: Date, default: null } // Date (YYYY-MM-DD) the streak was last incremented
        },
        weekly: {
            count: { type: Number, default: 0 },
            lastCompletedWeek: { type: String, default: null } // e.g., "2024-W25" (Year-WeekNumber)
        }
    },
    achievements: [{ // Store unlocked achievement IDs
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Achievement'
    }],
    // Add other gamification related fields if needed later
    // e.g., stats for specific triggers
    stats: {
         lessonsCompleted: { type: Number, default: 0 },
         subjectsCompleted: { type: Number, default: 0 },
         reviewSessionsCompleted: { type: Number, default: 0 },
         // Store total time per audio preset? Could get large. Maybe store in separate progress doc.
         // audioPresetUsage: { focus: Number, creative: Number, ... } // Total minutes
         aiInteractions: { type: Number, default: 0 },
    },
    // Learning Progress (Could be complex - links to progress tracking models)
    currentMissionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mission', // Assuming Mission model
        required: false,
    },
    lastLogin: {
        type: Date,
    },
    // Relational IDs stored in SQL can be referenced here if needed, though potentially redundant
    // subscriptionId: { type: String, required: false } // Example if needed

    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
    // Add more fields: learning style, custom avatar details, affiliate status etc.
});

// Index for faster lookups by provider and ID
UserSchema.index({ authProvider: 1, providerId: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

// Middleware to update `updatedAt` field on save
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to generate JWT for API authentication (called after OAuth validation)
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, role: this.role }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
    });
};

// Static method to find or create user after OAuth callback
UserSchema.statics.findOrCreate = async function(profile) {
    try {
        let user = await this.findOne({
            authProvider: profile.provider,
            providerId: profile.providerId
        });

        if (user) {
            // Update user info if changed (name, avatar)
            let updated = false;
            if (user.name !== profile.name) { user.name = profile.name; updated = true; }
            if (user.avatar !== profile.avatar) { user.avatar = profile.avatar; updated = true; }
            if (updated) { await user.save(); }
            return user;
        } else {
            // Create new user
            user = await this.create({
                name: profile.name,
                email: profile.email,
                authProvider: profile.provider,
                providerId: profile.providerId,
                avatar: profile.avatar,
                preferences: { // Set defaults
                    theme: 'system',
                    learningMode: 'elite_operative',
                },
            });
            logger.info(`New user created via ${profile.provider}: ${user.email}`);
            return user;
        }
    } catch (error) {
        logger.error(`Error in findOrCreate user for ${profile.email}:`, error);
        throw error; // Re-throw to be handled by the caller
    }
};


module.exports = mongoose.model('User', UserSchema);
const jwt = require('jsonwebtoken'); // Import JWT here to avoid circular dependency issues if needed elsewhere
const config = require('../config');
const logger = require('../utils/logger');